#!/usr/bin/env bash
set -euo pipefail
# set -x

THIS_FILE=$(readlink -f "${BASH_SOURCE[0]}")
THIS_DIR=$(dirname "$THIS_FILE")
ROOT_DIR=$(dirname "$THIS_DIR")
WORKSPACE_DIR="$(dirname "$ROOT_DIR")"

. "$THIS_DIR/kash/kash.sh"

## Parse options
##

DEFAULT_NODE_VER=20
DEFAULT_DEBIAN_VER=bookworm
NODE_VER=$DEFAULT_NODE_VER
DEBIAN_VER=$DEFAULT_DEBIAN_VER
PUBLISH=false
while getopts "d:n:pr:" option; do
    case $option in
        d) # defines debian version
            DEBIAN_VER=$OPTARG
            ;;
        n) # defines node version
            NODE_VER=$OPTARG
             ;;
        p) # define to publish container to registry
            PUBLISH=true
            ;;
        r) # report outcome to slack
            CI_STEP_NAME=$OPTARG
            load_env_files "$WORKSPACE_DIR/development/common/SLACK_WEBHOOK_APPS.enc.env"
            trap 'slack_ci_report "$ROOT_DIR" "$CI_STEP_NAME" "$?" "$SLACK_WEBHOOK_APPS"' EXIT
            ;;
        *)
            ;;
    esac
done

## Init workspace
##

APP="print"
VERSION="1.0.0"
FLAVOR=$(get_flavor_from_git "$ROOT_DIR")

echo "About to build $APP v$VERSION-$FLAVOR ..."

load_env_files "$WORKSPACE_DIR/development/common/kalisio_dockerhub.enc.env"
load_value_files "$WORKSPACE_DIR/development/common/KALISIO_DOCKERHUB_PASSWORD.enc.value"

## Build container
##

IMAGE_NAME="$KALISIO_DOCKERHUB_URL/kalisio/$APP"
IMAGE_TAG="$VERSION-$FLAVOR-node$NODE_VER-$DEBIAN_VER"

begin_group "Building container $IMAGE_NAME:$IMAGE_TAG ..."

# Copy nginx.conf in build output folder (so it's available in docker build context)
cp nginx.conf pdfme/playground/dist

docker login --username "$KALISIO_DOCKERHUB_USERNAME" --password-stdin "$KALISIO_DOCKERHUB_URL" < "$KALISIO_DOCKERHUB_PASSWORD"
# DOCKER_BUILDKIT is here to be able to use Dockerfile specific dockerginore (job.Dockerfile.dockerignore)
DOCKER_BUILDKIT=1 docker build \
    -f Dockerfile \
    -t "$IMAGE_NAME:$IMAGE_TAG" \
    "$ROOT_DIR/pdfme/playground/dist"

if [ "$PUBLISH" = true ]; then
    docker push "$IMAGE_NAME:$IMAGE_TAG"
    if [ "$NODE_VER" = "$DEFAULT_NODE_VER" ] && [ "$DEBIAN_VER" = "$DEFAULT_DEBIAN_VER" ]; then
        docker tag "$IMAGE_NAME:$IMAGE_TAG" "$IMAGE_NAME:$VERSION-$FLAVOR"
        docker push "$IMAGE_NAME:$VERSION-$FLAVOR"
        docker tag "$IMAGE_NAME:$IMAGE_TAG" "$IMAGE_NAME:$FLAVOR"
        docker push "$IMAGE_NAME:$FLAVOR"
    fi
fi

docker logout "$KALISIO_DOCKERHUB_URL"

end_group "Building container $IMAGE_NAME:$IMAGE_TAG ..."
