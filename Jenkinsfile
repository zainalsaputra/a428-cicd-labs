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

    stage('Deploy') {
        docker.image(nodeImage).inside(dockerArgs) {
            sh './jenkins/scripts/deliver.sh'
        }
    }

    stage('Archive Log') {
        sh '''
            cat > log.txt <<'EOF'
            CI/CD Pipeline Log Summary

            Pipeline:
            React App CI/CD Pipeline

            Stages:
            - Checkout : SUCCESS
            - Build    : SUCCESS
            - Test     : SUCCESS
            - Deploy   : SUCCESS

            Build:
            Dependencies were installed using npm install.

            Test:
            Test script was executed using ./jenkins/scripts/test.sh.

            Deploy:
            React App was built and started using ./jenkins/scripts/deliver.sh.

            EOF
                    '''

        archiveArtifacts artifacts: 'log.txt', fingerprint: true
    }
}