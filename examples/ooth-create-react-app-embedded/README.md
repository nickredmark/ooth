# Ooth meets create-react-app

This is an example integration of ooth and [Create React App](https://github.com/facebookincubator/create-react-app).

To run this example you need to run independently:

* the [ooth](../ooth) server example, which the create-react-app will use to login and get a JWT
* the example [graphql-app](../graphql-app), where the create-react-app will provide the JWT to start a session and get some data