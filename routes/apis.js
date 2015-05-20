module.exports = function(Debug, Express, Mongoose, Constants, connections) {
  var Router = Express.Router(),
      pattern = '/:idApi/*';

  Router.use(pattern, function(req, res, next) {
    var path = req.baseUrl,
        idApi = req.params.idApi;
    // Split and remove empty element;
    path = path.split('/').filter(function (e) {
        return e.length > 0;
    });

    // remove the component which contains the API Id.
    path = path.slice(1);

    if (path.length > 0) {
      Debug('API: ' + idApi);
      Debug('El path es:' + path);
      Debug('Query string is:');
      Debug(req.query);

      var params = [],
          length = path.length,
          j = 0;
      for (var i = 0; i < length; i += 2) {
        params[j++] = {
          schema: path[i],
          id: (path[i+1]) ? path[i+1] : false
        };
      }

      switch (req.method.toLowerCase()) { // GET POST PUT DELETE
        case 'get':
          Debug('GET');
          require('../http_methods/get.js')(Constants, res, idApi, connections, params, req.query);
          break;
        case 'put':
          Debug('PUT');
          DEBUG(req.body);
          require('../http_methods/put.js')(Constants, res, idApi, connections, params, req.body);
          break;
        case 'delete':
          Debug('DELETE');
          require('../http_methods/delete.js')(Constants, res, idApi, connections, params);
          break;
        case 'post':
          Debug('POST');
          Debug(req.body);
          require('../http_methods/post.js')(Constants, res, idApi, connections, params, req.body);
          break;
        default:
          Debug('Method still not implemented!');
      }
    } else if (Constants.showHomeApi) {
      Debug('Api home page');
      res.render('index-api', {
        api: idApi,
        title: idApi + ' :: provided by simpleRESTjs'
      });
    } else {
      var err = new Error('Not Found');
      err.status = 404;
      next(err);
    }
  });
  return Router;
}
