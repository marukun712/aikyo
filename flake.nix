{
  description = "pnpm workspace with dream2nix packaging + devShell + multi-companion dev runner";

  inputs = {
    dream2nix.url = "github:nix-community/dream2nix";
    nixpkgs.follows = "dream2nix/nixpkgs";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };

  outputs = inputs@{ self, nixpkgs, dream2nix, flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];

      perSystem = { system, ... }:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        readPkgJson = path:
          let p = builtins.fromJSON (builtins.readFile (path + "/package.json"));
          in {
            name = if p ? name then p.name else baseNameOf path;
            version = if p ? version then p.version else "0.0.0";
          };

        mkNode = path:
          let meta = readPkgJson path;
          in dream2nix.lib.evalModules {
            packageSets.nixpkgs = pkgs;
            modules = [
              dream2nix.modules.nodejs-package-json-v3
              dream2nix.modules.nodejs-builder-v3
              {
                name = meta.name;
                version = meta.version;

                paths.projectRoot = ./.;
                paths.projectRootFile = "pnpm-workspace.yaml";
                paths.package = path;
              }
            ];
          };
      in
      {
        packages = rec {
          firehose = mkNode ./packages/firehose;
          server   = mkNode ./packages/server;
          utils    = mkNode ./packages/utils;
          docs     = mkNode ./docs;

          default = server;
        };

        apps = {
          dev = {
            type = "app";
            program =
              (pkgs.writeShellApplication {
                name = "dev";
                runtimeInputs = [ pkgs.nodejs_22 pkgs.pnpm pkgs.coreutils ];
                text = ''
                  #!/usr/bin/env bash
                  set -euo pipefail

                  if [ "$#" -eq 0 ]; then
                    echo "Usage: nix run .#dev -- <COMPANION> [<COMPANION> ...]"
                    echo "Example: nix run .#dev -- hanabi polka"
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
                runtimeInputs = [ pkgs.nodejs_22 pkgs.pnpm ];
                text = ''
                  cd docs
                  exec pnpm run dev "$@"
                '';
              }).outPath + "/bin/docs";
          };
        };

        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_22
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
      };
    };
}
