{
  description = "pnpm workspace with devShell and multi-companion dev runner";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        apps = {
        dev = {
          type = "app";
          program =
            (pkgs.writeShellApplication {
              name = "dev";
              runtimeInputs = [ pkgs.nodejs_24 pkgs.pnpm pkgs.coreutils ];
              text = ''
                #!/usr/bin/env bash
                set -euo pipefail

                if [ "$#" -eq 0 ]; then
                  echo "Usage: nix run .#dev -- <COMPANION> [<COMPANION> ...]"
                  echo "Example: nix run .#dev -- kyoko aya"
                  exit 1
                fi

                pids=()

                pnpm firehose &
                pids+=($!)

                for name in "$@"; do
                  pnpm companion "$name" &
                  pids+=($!)
                done

                cleanup() {
                  trap - INT TERM EXIT
                  echo "Shutting down..."
                  kill "''${pids[@]}" 2>/dev/null || true
                  wait || true
                }
                trap cleanup INT TERM EXIT

                wait
              '';
            }).outPath + "/bin/dev";
        };

        docs = {
          type = "app";
          program =
            (pkgs.writeShellApplication {
              name = "docs";
              runtimeInputs = [ pkgs.nodejs_24 pkgs.pnpm ];
              text = ''
                cd docs
                exec pnpm run dev "$@"
              '';
            }).outPath + "/bin/docs";
        };

        bundle = {
          type = "app";
          program =
            (pkgs.writeShellApplication {
              name = "bundle";
              runtimeInputs = [ pkgs.nodejs_24 pkgs.pnpm ];
              text = ''
                pnpm install
                pnpm run bundle
              '';
            }).outPath + "/bin/bundle";
        };
      };

      devShells.default = pkgs.mkShell {
        packages = with pkgs; [
          nodejs_24
          pnpm
          git
          watchexec
        ];
        shellHook = ''
          export NODE_ENV=development
          if [ -f package.json ] && grep -q '"packageManager": *"pnpm@' package.json; then
            export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
            corepack enable >/dev/null 2>&1 || true
            corepack prepare --activate >/dev/null 2>&1 || true
          fi
          echo "[devshell] node $(node -v) / pnpm $(pnpm -v 2>/dev/null || echo 'via corepack')"
        '';
      };
    });
}
