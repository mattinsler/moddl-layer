(function() {
  var add_moddl, add_moddl_models, fs, path;

  fs = require('fs');

  path = require('path');

  module.exports = function(app) {
    var _base;
    if (app.models == null) {
      app.models = {};
    }
    if ((_base = app.path).models == null) {
      _base.models = path.join(app.path.app, 'models');
    }
    app.sequence('models').insert('moddl', add_moddl(app), {
      after: '*'
    });
    return app.sequence('models').insert('moddl-models', add_moddl_models(app), {
      after: '*'
    });
  };

  add_moddl = function(app) {
    return function(done) {
      var count, err, moddl, module, node_modules_path, _i, _len, _ref;
      node_modules_path = path.join(process.cwd(), 'node_modules');
      try {
        moddl = require(path.join(node_modules_path, 'moddl'));
      } catch (_error) {
        err = _error;
        if (err.code !== 'MODULE_NOT_FOUND') {
          return done(err);
        }
        return done(new Error('In order to use moddl-layer you must have moddl installed'));
      }
      console.log('Loading moddl-* libraries');
      count = 0;
      _ref = fs.readdirSync(node_modules_path);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        module = _ref[_i];
        if (!(module.indexOf('moddl-') === 0 && module !== 'moddl-layer')) {
          continue;
        }
        console.log('Loading', module);
        require(module)(moddl);
        ++count;
      }
      console.log('Loaded', count, 'moddl-* libraries');
      app.Model = moddl.Model;
      moddl.Model.connect(app.config);
      return done();
    };
  };

  add_moddl_models = function(app) {
    return function(done) {
      var read_dir, read_file;
      read_dir = function(dir) {
        var file, file_path, _i, _len, _ref, _results;
        _ref = fs.readdirSync(dir);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          if (!(file[0] !== '.')) {
            continue;
          }
          file_path = path.join(dir, file);
          if (fs.statSync(file_path).isDirectory()) {
            _results.push(read_dir(file_path));
          } else {
            _results.push(read_file(file_path));
          }
        }
        return _results;
      };
      read_file = function(file) {
        var k, v, _ref, _results;
        _ref = require(file);
        _results = [];
        for (k in _ref) {
          v = _ref[k];
          _results.push(app.models[k] = v);
        }
        return _results;
      };
      if (fs.existsSync(app.path.models)) {
        read_dir(app.path.models);
      }
      return done();
    };
  };

}).call(this);
