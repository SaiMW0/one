from flask import Flask, request, jsonify
from vincenty import vincenty

app = Flask(__name__)

@app.route('/calculate_distance', methods=['POST'])
def calculate_distance():
    data = request.get_json()
    point1 = (data['point1']['lat'], data['point1']['lon'])
    point2 = (data['point2']['lat'], data['point2']['lon'])
    distance = vincenty(point1, point2) * 1000  # Convert kilometers to meters
    return jsonify({'distance': distance})

@app.route('/')
def hello():
    return "Hello, Flask!"

if __name__ == '__main__':
    app.run(debug=True)
