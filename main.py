# -*- coding: utf-8 -*-
"""
Spyder Editor

This is a temporary script file.
"""
import os
import flask
from flask import request,render_template
from flask import jsonify, make_response
import pickle
import uuid
import sys
import scipy.io.wavfile
import soundfile as sf
from pydub import AudioSegment
from pydub.utils import make_chunks
from confidence_prediction import test_example
import random
sys.path.append("./api")
import Vokaturi
Vokaturi.load("./api/OpenVokaturi-3-3-linux64.so")
#Vokaturi.load("./api/OpenVokaturi-3-3-win64.dll")

app = flask.Flask(__name__)
app.config["DEBUG"] = True

def analyze_emotions(file_name):
    (sample_rate, samples) = scipy.io.wavfile.read(file_name)
    print ("   sample rate %.3f Hz" % sample_rate)
    buffer_length = len(samples)
    c_buffer = Vokaturi.SampleArrayC(buffer_length)
    if samples.ndim == 1:  # mono
        c_buffer[:] = samples[:] / 32768.0
    else:  # stereo
        c_buffer[:] = 0.5*(samples[:,0]+0.0+samples[:,1]) / 32768.0
    voice = Vokaturi.Voice (sample_rate, buffer_length)
    voice.fill(buffer_length, c_buffer)
    quality = Vokaturi.Quality()
    emotionProbabilities = Vokaturi.EmotionProbabilities()
    voice.extract(quality, emotionProbabilities)
    if quality.valid:
        return (float(emotionProbabilities.neutrality),float(emotionProbabilities.happiness),float(emotionProbabilities.sadness),float(emotionProbabilities.anger),float(emotionProbabilities.fear))
    else:
        return (float(0),float(0),float(0),float(0),float(0))

with open('logistic_regression_.pkl','rb') as f:
    clf = pickle.load(f) 
    print("Model loaded successfully")


@app.route('/', methods=['POST'])
def home():
    if request.method == 'POST':
        print(type(request.data))
        filename =  str(uuid.uuid4()) + '.wav'
        with open( filename, mode='wb') as f:
            f.write(request.data)
        print("file created")
        conf, nonconf = analyze( filename)
        print("Confidence ............ " + str(conf))
        return make_response(jsonify({"confidence":float(conf)}), 200)
    return "Not POST"

@app.route('/uploadfile',methods=['GET','POST'])
def uploadfile():
    if request.method == 'POST':
        f = request.file['file']
        f.save(f.filename)
        return "success"


@app.errorhandler(500)
def internal_error(error):

    return "Internal Server Error",500

@app.errorhandler(404)
def not_found(error):
    return "Not Found",404


def getGraphPoints(filename):
    myaudio = AudioSegment.from_file(filename , "wav") 
    duration = myaudio.__len__()
    total_steps = 5
    step_size_seconds =  duration/total_steps
    chunks = make_chunks(myaudio, step_size_seconds) #Make chunks of one sec
    graphPoints = []
    for i, chunk in enumerate(chunks):
        chunk_name = "chunk{0}.wav".format(i)
        chunk.export(chunk_name, format="wav")
        conf, nonconf = analyze(chunk_name)
        graphPoints.append(float(conf))
        #os.remove(chunk_name)
    return(graphPoints) 


@app.route('/upload',methods=['POST'])
def upload():
    f = request.files['file']
    f.save("static/"+f.filename)
    conf, nonconf = analyze("static/"+f.filename)
    neutral,happy,sad,anger,fear = analyze_emotions("static/"+f.filename)
    progressbar = {} 
    progressbar["confidence"] = float(conf*100)
    progressbar["happy"] = float(happy*100)
    progressbar["sad"] = float(sad*100)
    progressbar["neutral"] = float(neutral*100)
    progressbar["fear"] = float(fear*100)
    progressbar["anger"] = float(anger*100)
    print(progressbar)
    filePath = "static/"+f.filename
    graphPoints = getGraphPoints("static/"+f.filename)
    return render_template('analysis.html', title='Voxers - Analysis', progressbar=progressbar, filePath = filePath, graphPoints = graphPoints)
    

def analyze(filename):
    file_name =  filename
    print("here"+filename)
    test_exm = test_example(file_name,clf)
    print(test_exm[0,0], test_exm[0,1])
    return normalize(test_exm[0,0]), test_exm[0,1]


def normalize(conf):

   print("from normalize "+ str(conf))  
   if(conf*100 > 95):
       return (random.randrange(50, 100)*conf/100)
   elif(conf*100 < 15):
       return (random.randrange(100, 550)*conf/100)
   else:
       return conf

if __name__ == '__main__':
    # Bind to PORT if defined, otherwise default to 5000.
    port = int(os.environ.get('PORT', 5000))
    app.run(threaded=True, host='0.0.0.0', port=port)