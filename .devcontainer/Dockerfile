FROM nixos/nix:latest

# Enable Nix Flakes
RUN echo "experimental-features = nix-command flakes" >> /etc/nix/nix.conf

# Configure git to trust the workspace directory
RUN git config --global --add safe.directory /workspaces/aikyo

# Set up workspace
WORKDIR /workspaces/aikyo

# Set environment
ENV USER=vscode \
    LANG=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8

# Default shell
CMD ["/bin/bash"]
