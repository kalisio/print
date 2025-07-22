#!/usr/bin/env bash
set -euo pipefail
# set -x

THIS_FILE=$(readlink -f "${BASH_SOURCE[0]}")
THIS_DIR=$(dirname "$THIS_FILE")
ROOT_DIR=$(dirname "$THIS_DIR")
WORKSPACE_DIR="$(dirname "$ROOT_DIR")"

. "$THIS_DIR/kash/kash.sh"

PDFME_REPO_URL="https://github.com/pdfme/pdfme.git"
PDFME_DIR="$ROOT_DIR/pdfme"
PLAYGROUND_DIR="$ROOT_DIR/pdfme/playground"
PLUGINS_DIR="$PLAYGROUND_DIR/src/plugins"
PLUGINS_FILE="$PLUGINS_DIR/index.ts"
DESIGNER_FILE="$PLAYGROUND_DIR/src/routes/Designer.tsx"

## Parse options
##

WORKSPACE_BRANCH=
WORKSPACE_TAG=
WORKSPACE_NODE=20
WORKSPACE_KIND=
OPT_LIST="n:k:"
if [ "$CI" != true ]; then
    OPT_LIST="b:n:t:k:"
fi

while getopts "$OPT_LIST" OPT; do
    case $OPT in
        b) # defines branch to pull
            WORKSPACE_BRANCH=$OPTARG;;
        n) # defines node version
            WORKSPACE_NODE=$OPTARG;;
        t) # defines tag to pull
            WORKSPACE_TAG=$OPTARG;;
        k) # workspace kind (nokli kli klifull)
            WORKSPACE_KIND=$OPTARG;;
        *)
        ;;
    esac
done

begin_group "Setting up workspace ..."

if [ ! -d "$PDFME_DIR" ]; then
    # Create the PDFME directory and clone the repository
    mkdir -p "$PDFME_DIR"
    git clone "$PDFME_REPO_URL" "$PDFME_DIR"

    # Modify the plugins index.ts file
    # Inserts ‘map’ import at the beginning of the plugins file
    sed -i '1i import { map } from '\''./map.ts'\'';' "$PLUGINS_FILE"
    # Add the map plugin to the getPlugins return object
    sed -i '/return {/{n;s/^\s*/    Map: map,\n&/}' "$PLUGINS_FILE"

    # Copy map.ts from the root directory to the plugins directory
    cp "$ROOT_DIR/map.ts" "$PLUGINS_DIR/map.ts"

    # Copy utils.map.ts from the root directory to the pdfme directory
    cp "$ROOT_DIR/utils.map.ts" "$PLAYGROUND_DIR/src/utils.map.ts"

    # Modify Designer.tsx to integrate updatePluginMaps
    # Inserts updatePluginMaps import at the beginning of the designer file
    sed -i '1i import { updatePluginMaps } from "../utils.map";' "$DESIGNER_FILE"
    # 2. Add 'await updatePluginMaps(designer.current)' before 'await generatePDF(designer.current)'
    # Find the generatePDF call and insert updatePluginMaps before it
    sed -i '/await generatePDF(designer\.current)/i\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ await updatePluginMaps(designer.current);' "$DESIGNER_FILE"

    if  [ "$CI" = "true" ]; then
        setup_workspace "$WORKSPACE_DIR" "$KALISIO_GITHUB_URL/kalisio/development.git"
    fi

    # Install dependencies and build the project
    cd $PDFME_DIR && npm install && npm run build
    cd $PDFME_DIR/playground && npm install
fi

end_group "Setting up workspace ..."