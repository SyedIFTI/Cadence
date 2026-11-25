import os
import tempfile

# Use a throw-away database, set before the app is imported.
os.environ["DATA_DIR"] = tempfile.mkdtemp()
