
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


app.post('/add-voice', (req, res) => {
    addHandler(req, res)
});


app.post('/text-to-voice', (req, res) => {
  t2vHandler(req, res)
});


async function t2vHandler(req, res) {

  if (!process.env.ELEVENLABS_API_TOKEN) {
    throw new Error(
      "The ELEVENLABS_API_TOKEN environment variable is not set. See README.md for instructions on how to set it."
    );
  }
  
  try {
    const apiToken = process.env.ELEVENLABS_API_TOKEN;
    const { voice_id, text } = req.body
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;
    const headers = {
      accept: 'audio/mpeg',
      'xi-api-key': apiToken,
      'Content-Type': 'application/json',
    };
    
    const postData = {
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
      },
    };
    
    // const response = await axios.post(url, postData, {
    //   headers
    // });

    const response = await axios({
      method: 'post',
      url,
      data: postData,
      headers,
      responseType: 'stream' // Set the response type to 'stream' to handle large responses
    })

    res.statusCode = 200;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');


    // res.pipe(data);
    response.data.pipe(res);


  } catch (error) {
    console.log(error?.response?.data);
    res.statusCode = 500;
    res.end(JSON.stringify(error?.response?.data));

  }



}

async function addHandler(req, res) {

  if (!process.env.ELEVENLABS_API_TOKEN) {
    throw new Error(
      "The ELEVENLABS_API_TOKEN environment variable is not set. See README.md for instructions on how to set it."
    );
  }
  const apiToken = process.env.ELEVENLABS_API_TOKEN;

  const { name, audio_file_url, description, labels } = req.body

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
