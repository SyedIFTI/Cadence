
pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out Cadence repository...'
                checkout scm
            }
        }

        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    echo 'Installing frontend dependencies...'
                    sh 'npm install'

                    echo 'Building React application...'
                    sh 'npm run build'
                }
            }
        }

        stage('Backend Setup') {
            steps {
                dir('backend') {
                    echo 'Creating Python environment...'
                    sh 'python3 -m venv .venv'

                    echo 'Installing backend dependencies...'
                    sh './.venv/bin/python -m pip install -r requirements.txt'
                }
            }
        }

        stage('Backend Tests') {
            steps {
                dir('backend') {
                    echo 'Running backend tests...'
                    sh './.venv/bin/python -m pytest'
                }
            }
        }
    }

    post {
        success {
            echo 'Cadence CI Pipeline completed successfully!'
        }

        failure {
            echo 'Cadence CI Pipeline failed. Check the logs.'
        }
    }
}
