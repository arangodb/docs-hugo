import argparse

##CMDLINE ARGS
parser = argparse.ArgumentParser(description='Optional app description')
parser.add_argument('--src', type=str,
                    help='Old toolchain path docs folder included')
parser.add_argument('--dst', type=str,
                    help='New toolchain path docs folder included')
parser.add_argument('--arango-main', type=str,
                    help='Path of the arangodb main repository where all docublocks are located')
parser.add_argument('--version', type=str,
                    help='Version to migrate')
args = parser.parse_args()

if args.src is None or args.dst is None or args.version is None or args.arango_main is None:
	print("Args are required")
	exit(1)

# Handle Windows and trailing path separators
src = args.src.replace("\\", "/").rstrip("/")
dst = args.dst.replace("\\", "/").rstrip("/")
version = args.version.replace("\\", "/").rstrip("/")
main = args.arango_main.replace("\\", "/").rstrip("/")

OLD_TOOLCHAIN = src
NEW_TOOLCHAIN = f"{dst}/site"
ARANGO_MAIN = main

infos = {"": {}}
urlMap = {version: {}}
metrics = {"total": {}}

## DocuBlocks
ALL_COMMENTS_FILE = f"{OLD_TOOLCHAIN}/{version}/generated/allComments.txt"
OLD_GENERATED_FOLDER = f"{OLD_TOOLCHAIN}/{version}/generated/Examples"

blocksFileLocations = {}
components = {"schemas": {}, "parameters": [], "securitySchemes": [], "requestBodies": [], "responses": [], "headers": [], "links": [], "callbacks": []}

# hardcodedActions = {
#     "/arangograph": {
#         "action": "move-after",
#         "target": "/data-model",
#     },
#     "/aql": {
#         "action": "move-after",
#         "target": "arangograph"
#     },
#     "/http": {
#         "action": "move-inside",
#         "target": "develop"
#     },
#     "/drivers": {
#         "action": "move-inside",
#         "target": "develop"
#     }
# }
