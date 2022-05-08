FROM rust:1.60 as builder
WORKDIR /app
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libclang-dev
RUN rustup update nightly && \
    rustup target add wasm32-unknown-unknown --toolchain nightly
ADD . ./
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    --mount=type=cache,target=/app/target/release/build \
    --mount=type=cache,target=/app/target/release/deps \
    --mount=type=cache,target=/app/target/release/.fingerprint \
    --mount=type=cache,target=/app/target/release/wbuild \
    cargo build --bin poscan-consensus --release

FROM ubuntu:kinetic
ARG APP=/usr/src/app
COPY --from=builder /app/target/release/poscan-consensus ${APP}/p3d
WORKDIR ${APP}
EXPOSE 9933
# TODO: add correct bootnodes
CMD ["./p3d", "--unsafe-rpc-external", "--rpc-cors=all", "--validator", "--tmp"]