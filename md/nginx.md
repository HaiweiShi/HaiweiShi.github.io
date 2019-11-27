# nginx 基础知识整理
## Location
基于不同的IP、不同的端口以及不用得域名实现不同的虚拟主机，依赖于核心模块ngx_http_core_module实现。

语法规则: location [=|~|~*|^~] /uri/ { … }
* `=` 开头表示精确匹配
* `^~` 开头表示uri以某个常规字符串开头，理解为匹配 url路径即可。nginx不对url做编码，因此请求为/static/20%/aa，可以被规则^~ /static/ /aa匹配到（注意是空格）。
* `~` 开头表示区分大小写的正则匹配
* `~*` 开头表示不区分大小写的正则匹配
* `!~`和`!~*`分别为区分大小写不匹配及不区分大小写不匹配 的正则
* `/` 通用匹配，任何请求都会匹配到。  

## ReWrite
`rewrite`模块即`ngx_http_rewrite_module`模块，主要功能是改写请求URI，是Nginx默认安装的模块。rewrite模块会根据PCRE正则匹配重写URI，然后发起内部跳转再匹配location，或者直接做30x重定向返回客户端。  
语法规则: rewrite regex replacement [flag];
上下文: server, location, if
* flag 参数可以有以下的一些值：
  - last: 如果有last参数，那么停止处理任何rewrite相关的指令，立即用替换后的新URI开始下一轮的location匹配
  - break: 停止处理任何rewrite的相关指令，就如同break 指令本身一样。
  - redirect: replacement 如果不包含协议，仍然是一个新的的URI，那么就用新的URI匹配的location去处理请求，不会返回30x跳转。但是redirect参数可以让这种情况也返回30x(默认302)状态码，就像新的URI包含http://和https://等一样。这样的话，浏览器看到302，就会再发起一次请求，真正返回响应结果的就是这第二个请求。
  - permanent: 和redirect参数一样，只不过直接返回301永久重定向  
  last的break的相同点在于，立即停止执行所有当前上下文的rewrite模块指令；不同点在于last参数接着用新的URI马上搜寻新的location，而break不会搜寻新的location，直接用这个新的URI来处理请求，这样能避免重复rewite。因此，在server上下文中使用last，而在location上下文中使用break。

* 条件表达式  
-f和!-f用来判断是否存在文件  
-d和!-d用来判断是否存在目录  
-e和!-e用来判断是否存在文件或目录  
-x和!-x用来判断文件是否可执行  

根据文件类型设置过期时间
```
  location ~* \.(js|css|jpg|jpeg|gif|png|swf)$ {
    if (-f $request_filename) {
      expires 1h;
      break;
    }
  }
```
## ngx_http_auth_basic_module 模块
实现基于用户的访问控制，使用basic机制进行用户认证；
```
server {
  listen 80;
  server_name localhost;
  error_page 401 /401.html;
  location / {
    root d:/aaa;
    index index.html;
    auth_basic  "Admin"; ##认证对话框的提示字符串显示的内容
    auth_basic_user_file d:/aaa/.htpasswd; ##存放认证用的用户名和文件，需要用htpasswd命令生成
  }
}
```

## ngx_http_access_module 模块
这个模块只有2个指令  
格式：  
```
allow address | CIDR | unix: | all;  #允许访问
deny address | CIDR | unix: | all;   #拒绝访问
```
示例：  
```
location / {
     root   html;
     index  index.html index.htm;
     allow 192.168.253.129;  ##允许192.168.253.129访问
     deny 192.168.253.139;    ##拒绝192.168.253.139访问
}
```
## root 和 alias

```
server {
  listen 80;
  server_name www.wangshibo.com;
  index index.html index.php index.htm;
  access_log /usr/local/nginx/logs/image.log;
  location / {
      root /var/www/html;
  }
  location /haha { # 匹配的path目录haha不需要真实存在alias指定的目录中
    alias /var/www/html/ops/; # 后面的"/"符号一定要带上
    rewrite ^/opp/hen.php(.*)$ /opp/hen.php?s=$1 last;
    # rewrite ^/opp/(.*)$ /opp/hen.php?s=$1 last;
  }
  location /wang { # 匹配的path目录wang一定要真实存在root指定的目录中（就/var/www/html下一定要有wang目录存在）
    root /var/www/html;
  }
 }
```

## try_files
当用户请求 http://localhost/example 时，这里的 $uri 就是 /example。   
try_files 会到硬盘里尝试找这个文件。如果存在名为 /$root/example（其中 $root 是项目代码安装目录）的文件，就直接把这个文件的内容发送给用户。   
显然，目录中没有叫 example 的文件。然后就看 $uri/，增加了一个 /，也就是看有没有名为 /$root/example/ 的目录。   
又找不到，就会 fall back 到 try_files 的最后一个选项 /index.php，发起一个内部 “子请求”，也就是相当于 nginx 发起一个 HTTP 请求到 http://localhost/index.php。   
```
  loaction / {
    # try_files $uri $uri/ /index.html;
    try_files $uri @apache
  }
  loaction @apache{
    proxy_pass http://127.0.0.1:88
}
```
try_files方法让Ngxin尝试访问后面得$uri链接，并进根据@apache配置进行内部重定向。  
当然try_files也可以以错误代码赋值，如try_files /index.php = 404 @apache，则表示当尝试访问得文件返回404时，根据@apache配置项进行重定向  

## proxy_pass
在nginx中配置proxy_pass代理转发时，如果在proxy_pass后面的url加/，表示绝对根路径；如果没有/，表示相对路径，把匹配的路径部分也给代理走。  
假设下面四种情况分别用 http://192.168.1.1/proxy/test.html 进行访问。  
第一种：
```
  location /proxy/ {
    proxy_pass http://127.0.0.1/;
  }
```
代理到URL：http://127.0.0.1/test.html  

第二种（相对于第一种，最后少一个 / ）  
```
location /proxy/ {
    proxy_pass http://127.0.0.1;
}
```
代理到URL：http://127.0.0.1/proxy/test.html  

第三种：
```
location /proxy/ {
    proxy_pass http://127.0.0.1/aaa/;
}
```
代理到URL：http://127.0.0.1/aaa/test.html

第四种（相对于第三种，最后少一个 / ）
```
location /proxy/ {
    proxy_pass http://127.0.0.1/aaa;
}
```
代理到URL：http://127.0.0.1/aaatest.html

## 可以用作判断的全局变量  
1. $args  
HTTP 请求中的完整参数。例如，在请求/index.php?width=400&height=200 中，$args表示字符串width=400&height=200.
1. $arg_PARAMETER  
HTTP 请求中某个参数的值，如 /index.php?site=www.ttlsa.com 可以用$arg_site 取得www.ttlsa.com这个值.
1. $binary_remote_addr  
二进制格式的客户端地址。例如：\\x0A\\xE0B\\x0E
1. $body_bytes_sent  
表示在向客户端发送的http响应中，包体部分的字节数
1. $content_length  
表示客户端请求头部中的Content-Length 字段
1. $content_type  
表示客户端请求头部中的Content-Type 字段
1. $cookie_COOKIE  
表示在客户端请求头部中的cookie 字段
1. $document_root  
表示当前请求所使用的root 配置项的值
1. $uri  
表示当前请求的URI，不带任何参数
1. $document_uri  
与$uri 含义相同
1. $request_uri  
表示客户端发来的原始请求URI，带完整的参数。  
$uri和$document_uri未必是用户的原始请求，在内部重定向后可能是重定向后的URI，而$request_uri 永远不会改变，始终是客户端的原始URI.
1. $host  
表示客户端请求头部中的Host字段。如果Host字段不存在，则以实际处理的server（虚拟主机）名称代替。如果Host字段中带有端口，如IP:PORT，那么$host是去掉端口的，它的值为IP。  
$host是全小写的。这些特性与http_HEADER中的http_host不同，http_host只取出Host头部对应的值。
1. $hostname  
表示 Nginx所在机器的名称，与 gethostbyname调用返回的值相同
1. $http_HEADER  
表示当前 HTTP请求中相应头部的值。HEADER名称全小写。例如，示请求中 Host头部对应的值 用 $http_host表
1. $sent_http_HEADER  
表示返回客户端的 HTTP响应中相应头部的值。HEADER名称全小写。例如，用 $sent_ http_content_type表示响应中 Content-Type头部对应的值
1. $is_args  
表示请求中的 URI是否带参数，如果带参数，$is_args值为 ?，如果不带参数，则是空字符串
1. $limit_rate  
表示当前连接的限速是多少，0表示无限速
1. $nginx_version  
表示当前 Nginx的版本号
1. $query_string  
请求 URI中的参数，与 $args相同，然而 $query_string是只读的不会改变
1. $remote_addr  
表示客户端的地址
1. $remote_port  
表示客户端连接使用的端口
1. $remote_user  
表示使用 Auth Basic Module时定义的用户名
1. $request_filename  
表示用户请求中的 URI经过 root或 alias转换后的文件路径
1. $request_body  
表示 HTTP请求中的包体，该参数只在 proxy_pass或 fastcgi_pass中有意义
1. $request_body_file  
表示 HTTP请求中的包体存储的临时文件名
1. $request_completion  
当请求已经全部完成时，其值为 “ok”。若没有完成，就要返回客户端，则其值为空字符串；或者在断点续传等情况下使用 HTTP range访问的并不是文件的最后一块，那么其值也是空字符串。
1. $request_method  
表示 HTTP请求的方法名，如 GET、PUT、POST等
1. $scheme  
表示 HTTP scheme，如在请求 https://nginx.com/ 中表示 https
1. $server_addr  
表示服务器地址
1. $server_name  
表示服务器名称
1. $server_port  
表示服务器端口
1. $server_protocol  
表示服务器向客户端发送响应的协议，如 HTTP/1.1或 HTTP/1.0