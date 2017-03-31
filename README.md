# teacherSendMsgSys
教师消息推送系统<br/>

apk通过android-sdk-Hbuilder框架打包，集成jpush-hbuilder实现推送<br/>

角色：<b>教师</b><br/>
可通过管理界面管理团体人员，对群体发送消息，在线人员，通过websocket接收；发送未成功的人员，记录入库，上线时收取，同时通过手机端极光推送提醒

角色：<b>学生</b><br/>
当在线时可即时接收教师所发消息，未在线时，下次登录自动读取历史消息，并可通过APP消息推送接收
