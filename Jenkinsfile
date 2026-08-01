node {
    def nodeImage = 'node:16-buster-slim'
    def dockerArgs = '-u root:root -p 3000:3000'

    stage('Checkout') {
        checkout scm
    }

    stage('Build') {
        docker.image(nodeImage).inside(dockerArgs) {
            sh 'npm install'
        }
    }

    stage('Test') {
        docker.image(nodeImage).inside(dockerArgs) {
            sh './jenkins/scripts/test.sh'
        }
    }
}