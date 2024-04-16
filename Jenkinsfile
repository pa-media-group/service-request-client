pipeline {
  agent { label 'AWS_Jenkins-Node18' }

  libraries {
    lib 'jenkins-ci-tad'
  }

  options {
    buildDiscarder(logRotator(numToKeepStr: '5'))
    timeout(time: 10, unit: 'MINUTES')
    ansiColor('xterm')
  }

  parameters {
    string(name: 'ciChannel', defaultValue: 'banacek-jenkins', description: 'Slack Notification Channel')
  }

  environment {
    GH_TOKEN = credentials('GithubPAT')
    GIT_CREDENTIALS = credentials('github_semantic_release')
    NPM_TOKEN = credentials('npmrc')
  }

  tools {
    nodejs 'Node20.10.0'
  }

  stages {
    stage('Checkout') {
      steps {
        notifyStarted(params.ciChannel)
      }
    }

    stage('Install Dependencies') {
      steps {
        withNPM(npmrcConfig: 'basenpmrc') {
          sh 'npm ci'
        }
      }
    }

    stage('Lint Package') {
      steps {
        withNPM(npmrcConfig: 'basenpmrc') {
          sh 'npm run lint:package'
        }
      }
    }

    stage('Lint') {
      steps {
        withNPM(npmrcConfig: 'basenpmrc') {
          sh 'npm run lint'
        }
      }
    }

    stage('Build') {
      steps {
        withNPM(npmrcConfig: 'basenpmrc') {
          sh 'npm run build'
        }
      }
    }

    stage('Test') {
      steps {
        withNPM(npmrcConfig: 'basenpmrc') {
          script {
            sh 'npm run test'
          }
        }
      }
    }

    stage('Semantic Release') {
      environment {
        GH_TOKEN = credentials('GithubPAT')
        GIT_CREDENTIALS = credentials('github_semantic_release')
      }
      when {
        anyOf {
          branch 'main'
        }
      }
      steps {
        withNPM(npmrcConfig: 'basenpmrc') {
          sh 'npm run semantic-release'
        }
      }
    }

    stage('Deploy to NPM') {
      when {
        anyOf {
          branch 'main'
        }
      }
      steps {
        withNPM(npmrcConfig: 'npm-publish') {
          sh 'npm publish'
        }
      }
    }
  }

  post {
    cleanup {
      notifyResults(params.ciChannel)
      cleanWs()
    }
  }
}
