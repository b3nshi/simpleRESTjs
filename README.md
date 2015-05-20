# simpleRESTjs

simpleRESTjs is a "simple to use" REST Web Service based on nodejs, expressjs and mongodb.

The objective of this tool is to allow to the developers to test web and mobile apps which need to store data in the cloud and keep them sync.

Is a simple way to test if your app will work, quickly and with less effort.

The current version supports:
- GET/POST/PUT/DELETE methods.
- Embedded documents.
- auto_increment fields.
- Custom search (GET method):

  - q: Param to send filters.  
    Sample format:  
    ```
    q=fieldName1_value1,fieldName2_value2
    &q=fieldName3_value3,fieldName4_value4
    ```

    The comma separated fields in one "q" param will be converted to "and" filter and all "q" will merged as "or" filters.  
    ```
    (fieldName1=value1 AND fieldName2=value2)
    OR (fieldName3=value3 AND fieldName4=value4)
    ```

  - fields: Param to select which columns you want to get.  
    Sample format:  
    ```
    field1,field2,field3
    ```

  - sort: Param to select which columns you want to order.  
    Sample format:  
    ```
    field1|[ASC|DESC],field2|[ASC|DESC]
    ```

## Requirements

- Nodejs
- MongoDB
- NPM

## Installation

1. Checkout or download the repository.
2. Execute: npm install (to set up all dependencies).
3. Modify the file "api/test.json" or create a new API file.
4. Run the server: node bin/www
5. That's it! Enjoy your REST service.

## Usage

**Directory Structure:**

```
.
+-- app.js
+-- api
|   +-- test.json
+-- config
|   +-- constants.js
+-- http_methods
|   +-- delete.js
|   +-- get.js
|   +-- post.js
|   +-- put.js
+-- public
|   +-- css
|   |   +-- style.css
+-- routes
|   +-- apis.js
+-- views
|   +-- error.jade
|   +-- index-api.jade
|   +-- index.jade
|   +-- layout.jade

7 directories, 13 files
```

***app.js:***

Creates a simple Express app which define routes to open your customs apis.

***api/test.json***

A sample of an API definition file. You can create as many as you like, but be careful with the performance!

***config/constants.js***

The app constants and some configuration options.
  ```
  + showHomeApi: Show/Hide the API home page. You can personalize your own API homepage.
  ```

***http_methods/****

Implementation of each one of supported REST methods. (GET,PUT,POST,DELETE)

***public/***

Your static files. (CSS,JS)

***routes/apis.js***

The route to execute a method in the API.
    http://yourserver/:idAPI/schema
The idApi is the filename without the extension.

***views/****

All view files. In this case we are using jade (http://jade-lang.com), so you can find '.jade' files.

**Sample of usage**

The URL format is the following:  
  ```
  domain.com/:idApi/schema[/id][/nestedSchemas[/id]][/?GETOPTIONS]
  ```

Where:

- schema is the name of the "table" where you want to do something.  
  - GET: To get one record, you must set the ID:  
    ```
    domain.com/myApi/mySchema/1
    ```

  - GET: To search multiple records, you can use the search options:  
    ```
    domain.com/myApi/mySchema?q=title_Hello World&sort=dateCreated|ASC&fields=title,dateCreated
    ```

    Will search for records in mySchema with title = Hello World
    Sorted by dateCreated field ASC
    And will return only the fields: title and dateCreated.

  - DELETE: To delete one record, you must set the ID:  
    ```
    domain.com/myApi/mySchema/1
    ```

  - PUT: To update one record, you must set the ID:  
    ```
    domain.com/myApi/mySchema/1
    ```

  - POST: To create one record, you only need to specify the schema name.
    ```
    domain.com/myApi/mySchema
    ```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Life cycle

1. Make it works. --> DEVELOP FEATURES
2. Write it better.
3. Make it Faster. --> TAG RELEASE

## History

**v 0.0.1 [Current]**

- Methods: GET | POST | PUT | DELETE
- auto_increment fields
- Embedded documents
- Custom search
- API Homepage

## Credits

@b3nshi (www.xirom.com.ar)

## License

See [LICENSE](https://github.com/b3nshi/simpleRESTjs/blob/master/LICENSE).
