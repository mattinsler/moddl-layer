fs = require 'fs'
path = require 'path'

module.exports = (app) ->
  app.models ?= {}
  app.path.models ?= path.join(app.path.app, 'models')
  
  app.sequence('models').insert(
    'moddl', add_moddl(app)
    after: '*'
  )
  app.sequence('models').insert(
    'moddl-models', add_moddl_models(app)
    after: '*'
  )

add_moddl = (app) ->
  (done) ->
    # console.log 'Loading moddl library'
    
    node_modules_path = path.join(process.cwd(), 'node_modules')
    
    try
      moddl = require path.join(node_modules_path, 'moddl')
    catch err
      return done(err) unless err.code is 'MODULE_NOT_FOUND'
      return done(new Error('In order to use moddl-layer you must have moddl installed'))
    
    console.log 'Loading moddl-* libraries'
    count = 0
    for module in fs.readdirSync(node_modules_path) when module.indexOf('moddl-') is 0 and module isnt 'moddl-layer'
      console.log 'Loading', module
      require(module)(moddl)
      ++count
    console.log 'Loaded', count , 'moddl-* libraries'
    
    app.Model = moddl.Model
    moddl.Model.connect(app.config)
    done()

add_moddl_models = (app) ->
  (done) ->
    read_dir = (dir) ->
      for file in fs.readdirSync(dir) when file[0] isnt '.'
        file_path = path.join(dir, file)
        if fs.statSync(file_path).isDirectory()
          read_dir(file_path)
        else
          read_file(file_path)
    
    read_file = (file) ->
      app.models[k] = v for k, v of require(file)
    
    read_dir(app.path.models) if fs.existsSync(app.path.models)
    done()
