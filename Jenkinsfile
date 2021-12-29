pipeline {
agent any
    stages {
        stage('Checkout') {
            agent {label 'deploy-canvas'}
            steps {
             //checkout scm
			 checkout([$class: 'GitSCM',
                branches: [[name: '*/master' ]],
                extensions: scm.extensions,
                userRemoteConfigs: [[
                    url: 'https://gitlab.com/lti_cldpractice/CanvasDevOpsBackend.git',
                    credentialsId: 'gitlab-chirantan'
                ]]
            ])
            }
        }
		
		//stage('Code Analysis') {
		  //  agent{
           //     docker {
            //    image 'sonar-scanner2.8'
            //    label 'jnjappnode'
             //   }
		    //}  
			//steps {
			  // sh """sonar-scanner -Dsonar.analysis.buildNumber=${env.BUILD_NUMBER}"""
			//	}
			//}
		
		stage('Build Docker Image') {
			agent {label 'deploy-canvas'}
			steps{
              sh """docker build -t ${env.JOB_NAME}_img:v${env.BUILD_NUMBER} ."""
		    }
		}	
		
		stage('Deploy') {
		    agent {label 'deploy-canvas'}
			steps {
			//  sh "/home/support/create_service.sh devopsportal_service devopsportal_img latest 1"
				/* script{
					if(docker stop devopsportal_service || true && docker rm devopsportal_service || true){
						docker run -itd -p9090:8006 --name=devopsportal_service devopsportal_service_img:${env.BUILD_NUMBER}	
					}else{
						docker run -itd -p9090:8006 --name=${env.JOB_NAME}_service devopsportal_service_img:${env.BUILD_NUMBER}
					} 					
				} */
				echo "Removing the container if it exists"
				sh """/home/ubuntu/scripts/check_container.sh ${env.JOB_NAME}"""
				echo "Creating new container with the current docker image"
				sh """docker run -itd --restart unless-stopped -p8080:3000 --name=${env.JOB_NAME} ${env.JOB_NAME}_img:v${env.BUILD_NUMBER} """
			}
		}
    }
    post{
      success {
        		node('deploy-canvas') {
                  echo "Success"
        		// sh """/home/ubuntu/scripts/clearolddockerimagesofaproject.sh ${env.JOB_NAME}"""
        		sh """sudo /home/ubuntu/scripts/clearram.sh"""
                }
      }
    }
	
}
