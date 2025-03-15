import webbrowser
from backend.server import app

if __name__ == "__main__":
    # Open browser to the dashboard
    webbrowser.open('http://localhost:5002')
    # Start the Flask server
    app.run(host='0.0.0.0', port=5002, debug=True)
