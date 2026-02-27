[root@VM-8-11-opencloudos web-frontend-javascript]# history
    1   
    2  sudo yum install -y nodejs npm
    3  sudo yum install -y git
    4  git pull https://github.com/ultra-ai-labs/web-frontend-javascript.git
    5  git clone https://github.com/ultra-ai-labs/web-frontend-javascript.git
    6  cd web-frontend-javascript/
    7  npm install
    8  npm install --progress=true --loglevel=info
    9  ls
   10  cd web-frontend-javascript/
   11  npm run build --progress=true --loglevel=info
   12  npm install -g serve
   13  serve -s build -l 0.0.0.0:3000
   14  [root@VM-8-11-opencloudos ~]# serve -s build -l 0.0.0.0:3000
   15  file:///usr/local/lib/node_modules/serve/build/main.js:377
   16        throw new Error(
   17              ^
   18  Error: Unknown --listen endpoint scheme (protocol): 0.0.0.0:
   19      at parseEndpoint (file:///usr/local/lib/node_modules/serve/build/main.js:377:13)
   20      at type (/usr/local/lib/node_modules/serve/node_modules/arg/index.js:70:15)
   21      at arg (/usr/local/lib/node_modules/serve/node_modules/arg/index.js:170:24)
   22      at parseArguments (file:///usr/local/lib/node_modules/serve/build/main.js:414:28)
   23      at file:///usr/local/lib/node_modules/serve/build/main.js:503:40
   24      at ModuleJob.run (node:internal/modules/esm/module_job:195:25)
   25      at async ModuleLoader.import (node:internal/modules/esm/loader:337:24)
   26      at async loadESM (node:internal/process/esm_loader:34:7)
   27      at async handleMainPromise (node:internal/modules/run_main:106:12)
   28  Node.js v18.20.8
   29  [root@VM-8-11-opencloudos ~]# serve -s build -l 3000
   30  serve -s build --listen 3000
   31  curl http://43.161.219.41:3000/
   32  curl http://43.161.219.41:3000
   33  curl http://127.0.0.1:3000
   34  curl http://43.161.219.41:3000
   35  curl http://127.0.0.1:3000
   36  curl http://1124.156.182.182:3000
   37  curl http://124.156.182.182:3000
   38  cd web-frontend-javascript/
   39  sudo ufw status
   40  systemctl status sshd.service
   41  netstat -tnlp | grep sshd
   42  systemctl restart sshd
   43  tail -f /var/log/secure
   44  journalctl -u sshd -n 20
   45  cat /etc/hosts.allow
   46  systemctl status firewalld
   47  tail -n 30 /var/log/secure
   48  cd web-frontend-javascript/
   49  git pull
   50  npm run build
   51  sudo mkdir -p /usr/share/nginx/html
   52  sudo cp -r build/* /usr/share/nginx/html/
   53  cd web-frontend-javascript/
   54  sudo cp -r build/* /usr/share/nginx/html/
   55  sudo cp nginx.conf /etc/nginx/conf.d/web-frontend.conf
   56  sudo sudo cp nginx.conf /etc/nginx/conf.d/web-frontend.conf
   57  sudo cp nginx.conf /etc/nginx/conf.d/web-frontend.conf
   58  cat /etc/nginx/nginx.conf | grep include
   59  nginx --version
   60  sudo yum install nginx -y
   61  sudo systemctl start nginx
   62  sudo systemctl enable nginx
   63  # 创建静态文件存放目录
   64  sudo mkdir -p /usr/share/nginx/html
   65  # 假设你还在 web-frontend-javascript 目录下，且已经 npm run build 过了
   66  # 将打包好的文件复制过去
   67  sudo cp -r build/* /usr/share/nginx/html/
   68  sudo mkdir -p /usr/share/nginx/html
   69  sudo cp -r build/* /usr/share/nginx/html/
   70  sudo cp nginx.conf /etc/nginx/conf.d/web-frontend.conf
   71  sudo nginx -t
   72  sudo nginx -s reload
   73  telnet 43.161.219.41 3001
   74  ls
   75  cd web-frontend-javascript/
   76  git pull
   77  history
   78  npm run build
   79  NODE_OPTIONS=--max_old_space_size=2048 npm run build
   80  free -h
   81  NODE_OPTIONS=--max_old_space_size=1024 GENERATE_SOURCEMAP=false npm run build
   82  sudo cp -r build/* /usr/share/nginx/html/
   83  sudo systemctl restart nginx
   84  ls
   85  LS
   86  ls
   87  cd web-frontend-javascript/
   88  cat .env
   89  ls
   90  histrory
   91  git pull
   92  history
[root@VM-8-11-opencloudos web-frontend-javascript]# 