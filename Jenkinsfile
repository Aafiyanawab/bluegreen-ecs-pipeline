pipeline {
    agent any
    
    environment {
        AWS_REGION = 'us-east-1'
        AWS_ACCOUNT_ID = credentials('AWS_ACCOUNT_ID')
        ECR_REPO = 'bluegreen-app'
        IMAGE_TAG = "${BUILD_NUMBER}"
        ECR_URI = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code from GitHub...'
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image: ${ECR_URI}:${IMAGE_TAG}"
                dir('app') {
                    sh "docker build -t ${ECR_REPO}:${IMAGE_TAG} ."
                }
            }
        }

        stage('Push to ECR') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-credentials'
                ]]) {
                    sh """
                        aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                        
                        docker tag ${ECR_REPO}:${IMAGE_TAG} ${ECR_URI}:${IMAGE_TAG}
                        docker push ${ECR_URI}:${IMAGE_TAG}
                        
                        docker tag ${ECR_REPO}:${IMAGE_TAG} ${ECR_URI}:latest
                        docker push ${ECR_URI}:latest
                    """
                }
            }
        }

        stage('Deploy Green') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-credentials'
                ]]) {
                    sh """
                        aws ecs update-service \
                            --cluster bluegreen-cluster \
                            --service bluegreen-green \
                            --force-new-deployment \
                            --region ${AWS_REGION}
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                echo 'Waiting for green deployment to stabilise...'
                sleep(30)
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-credentials'
                ]]) {
                    sh """
                        aws ecs wait services-stable \
                            --cluster bluegreen-cluster \
                            --services bluegreen-green \
                            --region ${AWS_REGION}
                    """
                }
                echo 'Green is healthy!'
            }
        }

        stage('Switch Traffic to Green') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-credentials'
                ]]) {
                    sh """
                        aws elbv2 modify-listener \
                            --listener-arn \$(aws elbv2 describe-listeners \
                                --load-balancer-arn \$(aws elbv2 describe-load-balancers \
                                    --names bluegreen-alb \
                                    --query 'LoadBalancers[0].LoadBalancerArn' \
                                    --output text \
                                    --region ${AWS_REGION}) \
                                --query 'Listeners[0].ListenerArn' \
                                --output text \
                                --region ${AWS_REGION}) \
                            --default-actions Type=forward,TargetGroupArn=\$(aws elbv2 describe-target-groups \
                                --names bluegreen-green-tg \
                                --query 'TargetGroups[0].TargetGroupArn' \
                                --output text \
                                --region ${AWS_REGION}) \
                            --region ${AWS_REGION}
                    """
                }
                echo 'Traffic switched to Green successfully!'
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully! Green is live.'
        }
        failure {
            echo 'Pipeline failed! Blue is still serving traffic.'
        }
    }
}