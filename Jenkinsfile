node {
    def nodeImage = 'node:20-bookworm-slim'

    // Application identity.
    def appName = 'react-app'
    def appContainer = 'react-app'
    def appAlias = 'react-app'
    def appPort = '80'

    // Must match APP_DOMAIN_SUFFIX on compose-stack.
    def appDomain = 'react-app.info-siber.com'

    // Docker network created by compose-stack.
    def ingressNetwork = 'compose-stack-app-ingress'

    // Path of compose-stack on deployment server.
    def composeStackPath = '/opt/compose-stack'

    // Deployment server.
    def deployHost = '202.10.45.194'

    // Jenkins credentials.
    def deploySshCredential = 'personal-deploy-ssh'
    def knownHostsCredential = 'personal-deploy-known-hosts'

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
                    npm ci
                '''
            }
        }

        stage('Test') {
            docker.image(nodeImage).inside('-u root:root -e NODE_OPTIONS=--openssl-legacy-provider') {
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
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# react-scripts 4 uses Webpack 4, which requires the OpenSSL legacy provider
# when building on Node.js 17+ / OpenSSL 3.
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build

FROM nginx:stable-alpine

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80
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

sudo docker network inspect ${ingressNetwork} >/dev/null 2>&1 || {
    echo "Required Docker network '${ingressNetwork}' does not exist."
    exit 1
}

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
Application was deployed as a persistent Nginx container.
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