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

    stage('Manual Approval') {
        input message: 'Lanjutkan ke tahap Deploy?'
    }

    stage('Deploy') {
        docker.image(nodeImage).inside(dockerArgs) {
            sh './jenkins/scripts/deliver.sh'

            sh '''
                echo "React App is running at http://localhost:3000"
                echo "Keeping application alive for 1 minute..."
                sleep 60
                echo "Stopping React App after 1 minute..."
            '''

            sh './jenkins/scripts/kill.sh'
        }
    }

    stage('Archive Log') {
        sh '''
            cat > log.txt <<'EOF'
            CI/CD Pipeline Log Summary

            Pipeline:
            React App CI/CD Pipeline

            Project:
            a428-cicd-labs - react-app branch

            Stages:
            - Checkout        : SUCCESS
            - Build           : SUCCESS
            - Test            : SUCCESS
            - Manual Approval : PROCEEDED
            - Deploy          : SUCCESS

            Build:
            Dependencies were installed using npm install.

            Test:
            Test script was executed using ./jenkins/scripts/test.sh.

            Manual Approval:
            Pipeline was paused before deployment with the message:
            "Lanjutkan ke tahap Deploy?"

            Deploy:
            React App was built using npm run build.
            React App was started using ./jenkins/scripts/deliver.sh.
            The application was kept running for 1 minute using sleep 60.
            After 1 minute, the application was stopped using ./jenkins/scripts/kill.sh.

            EOF
        '''

        archiveArtifacts artifacts: 'log.txt', fingerprint: true
    }
}