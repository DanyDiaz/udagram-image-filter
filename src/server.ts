import express from 'express';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles} from './util/util';

const fetch = require('node-fetch');

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());
  
  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async ( req, res ) => {
    res.send("try GET /filteredimage?image_url={{}}")
  } );
  
  // GET /filteredimage?image_url={{URL}}
  // endpoint to filter an image from a public url.
  // IT SHOULD
  //    1. validate the image_url query
  //    2. call filterImageFromURL(image_url) to filter the image
  //    3. send the resulting file in the response
  //    4. deletes any files on the server on finish of the response
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file
  app.get( "/filteredimage", async ( req, res ) => {
    const image_url : string = req.query.image_url;

    //1. validate the image_url query
    if(!image_url || image_url === '') {
      return res.status(400).send({message: 'image_url is a required query'});
    }

    //based on: https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
    var urlPattern = new RegExp('^(https?:\\/\\/)?'+
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+
      '((\\d{1,3}\\.){3}\\d{1,3}))'+
      '(\\:\\d+)?(\\/[-a-z\(\)\\d%_.~+]*)*'+
      '(\\?[;&a-z\\d%_.~+=-]*)?'+
      '(\\#[-a-z\\d_]*)?$','i');
    if(!urlPattern.test(image_url)) {
      return res.status(400).send({message: 'your value "' + image_url + '" is not a valid URL'});  
    }

    //check if the image actually exists
    const existImage : boolean = await fetch(image_url, { method: 'HEAD' })
    .then((r: any) => {
      if (r.ok) {
        return true;
      }
      return false;
    }).catch(() => {
      return false;
    });

    if(!existImage) {
      return res.status(500).send({message: 'Image does not exist or there was a problem while fetching it. Try again later'});
    }

    //2. call filterImageFromURL(image_url) to filter the image
    const outImagePath : string = await filterImageFromURL(image_url);

    //3. send the resulting file in the response
    res.status(200).sendFile(outImagePath, (err) => {
      //4. deletes any files on the server on finish of the response
      deleteLocalFiles([outImagePath]);
    })
  } );

  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );
})();