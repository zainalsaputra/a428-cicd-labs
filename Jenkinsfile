node {
    def nodeImage = 'node:16-buster-slim'

    // Application identity.
    def appName = 'react-app'
    def appContainer = 'react-app'
    def appAlias = 'react-app'
    def appPort = '3000'

    // Must match APP_DOMAIN_SUFFIX on compose-stack.
    def appDomain = 'react-app.apps.xenia-hospitality.id'

    // Docker network created by compose-stack.
    def ingressNetwork = 'compose-stack-app-ingress'

    // Path of compose-stack on deployment server.
    def composeStackPath = '/opt/compose-stack'

    // Configure this with the deployment server IP / hostname.
    def deployHost = 'YOUR_DEPLOY_SERVER_IP'

    // Jenkins credentials.
    def deploySshCredential = 'xenia-deploy-ssh'
    def knownHostsCredential = 'xenia-deploy-known-hosts'

    // Immutable image name for each Jenkins build.
    def imageName = "${appName}:${env.BUILD_NUMBER}"

    try {
        stage('Checkout') {
            checkout scm
        }

        stage('Build Dependencies') {
            docker.image(nodeImage).inside('-u root:root') {
                sh '''
                    set -e

                    if [ -f package-lock.json ]; then
                        npm ci
                    else
                        npm install
                    fi
                '''
            }
        }

        stage('Test') {
            docker.image(nodeImage).inside('-u root:root') {
                sh '''
                    set -e
                    chmod +x ./jenkins/scripts/test.sh
                    ./jenkins/scripts/test.sh
                '''
            }
        }

        stage('Build Application Image') {
            sh """
                set -e

                cat > Dockerfile.jenkins <<'EOF'
                FROM node:16-buster-slim AS builder

                WORKDIR /app

                COPY package*.json ./

                RUN if [ -f package-lock.json ]; then \
                        npm ci; \
                    else \
                        npm install; \
                    fi

                COPY . .

                RUN npm run build


                FROM node:16-buster-slim

                WORKDIR /app

                RUN npm install -g serve

                COPY --from=builder /app/build ./build

                EXPOSE 3000

                CMD ["serve", "-s", "build", "-l", "3000"]
                EOF

                docker build \
                    -f Dockerfile.jenkins \
                    -t ${imageName} \
                    .
            """
        }

        stage('Manual Approval') {
            input message: """
Deploy ${appName}?

Domain:
https://${appDomain}

Image:
${imageName}
"""
        }

        stage('Deploy') {
            withCredentials([
                sshUserPrivateKey(
                    credentialsId: deploySshCredential,
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USER'
                ),
                file(
                    credentialsId: knownHostsCredential,
                    variable: 'KNOWN_HOSTS'
                )
            ]) {
                sh """
                    set -e

                    SSH_OPTIONS="-i \$SSH_KEY \
                        -o UserKnownHostsFile=\$KNOWN_HOSTS \
                        -o StrictHostKeyChecking=yes"

                    echo "Transferring Docker image ${imageName}..."

                    docker save ${imageName} | \
                        gzip | \
                        ssh \$SSH_OPTIONS \
                            \$SSH_USER@${deployHost} \
                            'gunzip | sudo docker load'


                    echo "Deploying ${appContainer}..."

                    ssh \$SSH_OPTIONS \
                        \$SSH_USER@${deployHost} <<'REMOTE_DEPLOY'
set -e

sudo docker rm -f ${appContainer} 2>/dev/null || true

sudo docker run -d \
    --name ${appContainer} \
    --restart unless-stopped \
    --network ${ingressNetwork} \
    --network-alias ${appAlias} \
    ${imageName}

sudo bash ${composeStackPath}/app-route.sh register \
    --host ${appDomain} \
    --upstream ${appAlias}:${appPort}
REMOTE_DEPLOY
                """
            }
        }

        stage('Health Check') {
            sh """
                set -e

                echo "Waiting for application..."

                for attempt in \$(seq 1 30); do
                    STATUS=\$(curl \
                        --silent \
                        --output /dev/null \
                        --write-out '%{http_code}' \
                        --max-time 10 \
                        https://${appDomain} || true)

                    if echo "\$STATUS" | grep -Eq '^(2|3)[0-9][0-9]\$'; then
                        echo "Application healthy."
                        echo "URL: https://${appDomain}"
                        exit 0
                    fi

                    echo "Attempt \$attempt: HTTP \$STATUS"
                    sleep 5
                done

                echo "Application health check failed."
                exit 1
            """
        }

        stage('Archive Log') {
            sh """
                cat > log.txt <<EOF
CI/CD Pipeline Log Summary

Pipeline:
React App CI/CD Pipeline

Project:
a428-cicd-labs - react-app branch

Build Number:
${env.BUILD_NUMBER}

Application:
${appName}

Docker Image:
${imageName}

Domain:
https://${appDomain}

Ingress Network:
${ingressNetwork}

Stages:
- Checkout        : SUCCESS
- Dependencies    : SUCCESS
- Test            : SUCCESS
- Docker Build    : SUCCESS
- Manual Approval : PROCEEDED
- Deploy          : SUCCESS
- Health Check    : SUCCESS

Deployment:
Application was deployed as a persistent Docker container.
The container joined ${ingressNetwork}.
Nginx routing was registered through app-route.sh.

Route:
${appDomain} -> http://${appAlias}:${appPort}

EOF
            """

            archiveArtifacts artifacts: 'log.txt', fingerprint: true
        }

    } finally {
        sh """
            docker image rm ${imageName} 2>/dev/null || true
            rm -f Dockerfile.jenkins
        """
    }
}