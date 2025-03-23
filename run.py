# run.py
from app import create_app

app = create_app()


@app.route("/")
def welcome():
    return "sunshine here"


if __name__ == '__main__':
    app.run(debug=True)
