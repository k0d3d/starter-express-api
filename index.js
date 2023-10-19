
import axios from 'axios';
import http from 'http';
import https from 'https';
import got from 'got';
import express from 'express'
import FormData from 'form-data'
import bodyParser from'body-parser'

const app = express()

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())


app.post('/', (req, res) => {
    handler(req, res)
});

async function handler(req, res) {

  if (!process.env.ELEVENLABS_API_TOKEN) {
    throw new Error(
      "The ELEVENLABS_API_TOKEN environment variable is not set. See README.md for instructions on how to set it."
    );
  }
  const apiToken = process.env.ELEVENLABS_API_TOKEN;

  const { name, audio_file_url, description, labels } = req.body
  res.json(req.body);


  let readStream;
  try {
    // readStream = (audio_file_url.startsWith('https') ? https : http).get(audio_file_url);
    readStream = got.stream(audio_file_url);
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ detail: error }));
  }

  const form = new FormData();
  form.append('name', name || 'Voice Name');
  form.append('files', readStream, { filename: Date.now() + '-sample.mp3', contentType: 'audio/mpeg' });
  form.append('description', description || 'Voice Description');
  // form.append('labels', JSON.stringify(labels));


  try {

    const response = await axios.post('https://api.elevenlabs.io/v1/voices/add', form, {
      headers: {
        'accept': 'application/json',
        'xi-api-key': apiToken,
        ...form.getHeaders()
      },
    });

    const data = response.data;
    
    res.statusCode = 200;
    res.json(data);

  } catch (error) {
    res.statusCode = 500;
    res.json(error.message);

  }



}
app.listen(process.env.PORT || 3000)
