Storing Data
As a Plugin author you may want to store some data that your Plugin can use the next time it opens. There are three options for storing data:

Storing global data on a project level

Storing data on a specific node

Storing user specific data on the client

Important: Don’t use this API to store sensitive data such as secret keys or access tokens.

Storing global project data
You may want to store data at the project level that is shared between users. There are API methods available on the framer export for this.

// Set global data on the project.
await framer.setPluginData('key', 'value');

// Get global data from the project.
const data = await framer.getPluginData('key');
Note: A data entry only supports strings and can contain a maximum of 2kB per entry, with a total of 4kB. If you exceed this limit, the setPluginData method will throw. It is still possible to delete plugin data.
