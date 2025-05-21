from flask import Flask, render_template  # Import Flask and template rendering

app = Flask(__name__)  # Create a Flask web app

@app.route('/')  # Define the route for the homepage
def index():
    return render_template('index.html')  # Render and return index.html

if __name__ == '__main__':  # Run this code only if this file is executed directly
    app.run(debug=True)  # Start the server in debug mode

