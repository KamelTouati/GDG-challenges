```markdown
# Secure RESTful API with User Authentication and Data Storage

This is a secure RESTful API project that allows users to register, authenticate, and store sensitive data securely. The goal of this project is to protect user information from unauthorized access and provide a safe environment for data storage.

## Features

1. **User Registration:** Users can sign up with a username and a securely hashed password.

2. **User Authentication:** Registered users can securely log in with their credentials using strong encryption and JWT-based token authentication.

3. **Data Storage:** Authenticated users can store their sensitive data securely. The data is associated with the user and stored in a protected database.

## Technologies Used

- Python
- Flask: A micro web framework for building the API.
- SQLAlchemy: An Object-Relational Mapping (ORM) library for working with the database.
- Bcrypt: For securely hashing user passwords.
- JWT (JSON Web Tokens): For user authentication and access control.
- PostgreSQL (or your choice of database): To store user data and sensitive information securely.

## Getting Started

1. Clone the repository:

```shell
git clone https://github.com/KamelTouati/SafeBox-Challenge.git
```

2. Set up a virtual environment and install dependencies:

```shell
python -m venv venv
source venv/bin/activate  # On Windows, use venv\Scripts\activate
pip install -r requirements.txt
```

3. Set environment variables:

   - `SECRET_KEY`: Replace with a strong, random secret key for JWT.
   - `DATABASE_URL`: Replace with the connection URL for your chosen database.

4. Run the application:

```shell
flask run
```

The API should now be accessible at `http://localhost:5000`.

## API Endpoints

- `POST /register`: Register a new user with a username and password.
- `POST /login`: Authenticate a user and receive an access token.
- `POST /store-data`: Store sensitive data associated with the authenticated user.

Detailed API documentation is available within the code and can be accessed by browsing the API in your web browser or using tools like Swagger.

## Security Measures

- Passwords are securely hashed using Bcrypt.
- JWT tokens are used for secure user authentication.
- Secure database storage and proper authorization checks for data storage and retrieval.