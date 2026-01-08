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
APP_FILE="$PLAYGROUND_DIR/src/App.tsx"
EXTERNAL_BUTTON_FILE="$PLAYGROUND_DIR/src/components/ExternalButton.tsx"
VITE_CONFIG_FILE="$PLAYGROUND_DIR/vite.config.ts"

## Parse options
##

WORKSPACE_BRANCH=
WORKSPACE_TAG=
WORKSPACE_NODE=20
WORKSPACE_KIND=klifull
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

# if  [ "$CI" = "true" ]; then
#     setup_workspace "$WORKSPACE_DIR" "$KALISIO_GITHUB_URL/kalisio/development.git"
# fi

if [ "$CI" = true ]; then
    setup_app_workspace \
        "$ROOT_DIR" \
        "$WORKSPACE_DIR" \
        "$KALISIO_GITHUB_URL/kalisio/development.git" \
        "$WORKSPACE_NODE" \
        "workspaces/apps" \
        "$WORKSPACE_KIND" \
        "${WORKSPACE_TAG:-$WORKSPACE_BRANCH}"
fi

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
    # Add 'await updatePluginMaps(designer.current)' before 'await generatePDF(designer.current)'
    # Find the generatePDF call and insert updatePluginMaps before it
    sed -i '/await generatePDF(designer\.current)/i\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ await updatePluginMaps(designer.current);' "$DESIGNER_FILE"

    # Add base option to Vite config 
    sed -i "/export default defineConfig({/a\\
  base: '/api/playground/'," "$VITE_CONFIG_FILE"

    #
    sed -i 's#<a href={href} target="_blank" rel="noopener noreferrer">#<a href={href} target="_blank" rel="noopener noreferrer" className="hidden">#' "$EXTERNAL_BUTTON_FILE"

    # Replace entire App.tsx content
    cat > "$APP_FILE" << 'EOF'
    import { useEffect } from "react";
    import { Routes, Route } from "react-router-dom";
    import { ToastContainer } from 'react-toastify';
    import Designer from "./routes/Designer";

    export default function App() {
        useEffect(() => {
            const handle = (e: KeyboardEvent) =>
            ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)
                && (e.preventDefault(), e.stopPropagation());
            document.addEventListener('keydown', handle, true);
            return () => document.removeEventListener('keydown', handle, true);
        }, []);

    return (
        <div className="min-h-screen flex flex-col">
        <Routes>
            <Route path={"/api/playground"} element={<Designer />} />
        </Routes>
        <ToastContainer />
        </div>
    );
    }
EOF

    # Install dependencies and build the project
    cd $PDFME_DIR && npm install && npm run build
    cd $PDFME_DIR/playground && npm install
fi

# if [ "$CI" != true ]; then
#     # This code is only executed when we're running on developer machines.
#     # In this case, we expect an additional argument to define where to create the 'CI workspace'
#     shift $((OPTIND-1))
#     WORKSPACE_DIR="$1"

#     # unset KALISIO_DEVELOPMENT_DIR because we want kli to clone everyhting in $WORKSPACE_DIR
#     unset KALISIO_DEVELOPMENT_DIR
#     # TODO: you may need to undef more variables like this if you have client specific environment variables
#     # Here we don't since it's all kalisio code
# fi


end_group "Setting up workspace ..."