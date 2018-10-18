<template>
  <div id="app">
    <div class="header">
      <div class="logo">Fonts-Trans</div>
      <div class="slogn">{{ msg }}</div>
      <button @click="addProjectDialog">添加新项目</button>
    </div>
    <div class="body">
      <template v-for="(pro, index) in projectList">
        <div class="project-header">
          <h2>{{pro.name}}</h2>
          <div class="button-group">
            <button @click="showAddFont(pro.id, pro.name, pro.icons_id)">添加图标</button>
            <button @click="download(pro.svgs)">导出当前项目</button>
            <button class="grey" @click="clearProject(pro.id, pro.name, pro.icons_id)">清空项目</button>
            <button class="grey" @click="deleteProject(pro.id)">删除项目</button>
          </div>
        </div>
        <ul class="image-group">
          <li v-for="(icon, iconIndex) in pro.svgs">
            <div class="img block" @click.stop="chose($event, icon)">
              <img :src="icon.file">
            </div>
          </li>
        </ul>
      </template>

      <div v-if="showDialog" class="dialog">
        <div class="dialog-title">添加图标</div>
        <input type="file" name="upload" @change="uploadSvg"/>
        <div class="image-group">
          <template v-for="img in uploadList">
            <div class="img">
              <img :src="img.src">
            </div>
          </template>
        </div>
        <div class="dialog-buttons">
          <button @click="saveUpload">保存</button> <button @click="hideDialog" class="grey">关闭</button>
        </div>
      </div>

      <div v-if="showProjectDialog" class="dialog">
        <div class="dialog-title">添加项目</div>
        <label class="input-label">请输入项目名</label><input class="input" type="text" name="projectname" placeholder="项目名" maxlength="20" />
        <div class="dialog-buttons">
          <button @click="saveProject">保存</button> <button @click="hideProjectDialog" class="grey">关闭</button>
        </div>
      </div>
    </div>
    <div class="footer">
      <button @click="exportChosed">导出所选项</button>
    </div>
  </div>
</template>

<script>
import $ from 'jquery'
import {Request} from '@/libs/request.js'
export default {
  name: 'app',
  data () {
    return {
      msg: 'Welcome to Use Font-trans Platform',
      projectList: [],
      nowProject: {},
      showDialog: false,
      showProjectDialog: false,
      uploadList: [],
      choseList: []
    }
  },
  mounted() {
    this.getProjectList()
  },
  watch: {
    uploadList(newVal, oldVal) {
      console.log(newVal)
    },
    choseList(newVal, oldVal) {
      console.log(newVal)
    }
  },
  methods: {
    getProjectList() {
      Request('GET', '/project/list')
        .then((res) => {
          this.projectList = res.data.list
          console.log(res)
        })
    },
    showAddFont(id, name, icons_id) {
      this.nowProject = {
        id: id,
        name: name,
        icons_id: icons_id
      }
      this.showDialog = true
    },
    hideDialog() {
      this.showDialog = false
      this.uploadList = []
    },
    uploadSvg(e) {
      let file = e.target.files[0];
      let param = new FormData(); //创建form对象
      param.append('file', file); //通过append向form对象添加数据
      let config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }; //添加请求头

      Request('POST', '/upload/upload', param, config)
        .then((res) => {
          this.saveSvg(res.data)
        })
    },
    saveSvg(params) {
      Request('POST', '/font/add', params)
        .then((res) => {
          if(res.ret != 0) {
            alert(res.msg)
          }else{
            this.uploadList.push(params)
            let index = this.uploadList.length - 1;
            this.$set(this.uploadList, index, Object.assign(this.uploadList[index], {
              svg_id: res.data.insertId
            }))
          }
        })
    },
    saveUpload() {
      let icons_id = []
      for(let i = 0; i < this.uploadList.length; i ++){
        icons_id.push(this.uploadList[i].svg_id)
      }

      if(icons_id.length == 0){
        alert('没有上传文件!')
        return false;
      }
      let oldIcons = this.nowProject.icons_id ? this.nowProject.icons_id.split(',') : ''

      icons_id = icons_id.concat(oldIcons)

      Request('POST', '/project/update', {
        name: this.nowProject.name,
        id: this.nowProject.id,
        icons_id: icons_id.join(',')
      })
        .then((res) => {
          if(res.ret != 0) {
            alert(res.msg)
          }else{
            this.getProjectList()
            this.hideDialog()
          }
        })
    },
    clearProject(id, name, icons_id) {
      Request('POST', '/project/update', {
        name: name,
        id: id,
        icons_id: ''
      })
        .then((res) => {
          if(res.ret != 0) {
            alert(res.msg)
          }else{
            this.getProjectList()
          }
        })
    },
    deleteProject(id) {
      Request('POST', '/project/delete', {
        id: id
      })
        .then((res) => {
          if(res.ret != 0) {
            alert(res.msg)
          }else{
            this.getProjectList()
            this.hideDialog()
          }
        })
    },
    download(files) {
      Request('POST', '/font/translate', {
        fontName: 'testfont',
        files: files,
      })
        .then((res) => {
          if(res.ret != 0) {
            alert(res.msg)
          }else{
            window.open(res.data.url)
          }
        })
    },
    chose(evt, icon) {
      let index = -1
      for(let i = 0; i < this.choseList.length; i ++ ) {
        if(this.choseList[i].file == icon.file) {
          index = i
          break
        }
      }

      if(index != -1) {
        this.choseList.splice(index, 1)
      }else{
        this.choseList.push(icon)
      }

      $(evt.target).parents('li').find('.img').toggleClass('active')
    },
    addProjectDialog() {
      this.showProjectDialog = true
    },
    saveProject() {
      let name = $('input[name=projectname]').val().trim()
      if(!name) {
        alert('请输入项目名')
        $('input[name=projectname]').val('')
        return false
      }
      Request('POST', '/project/add', {
        name: name
      })
        .then((res) => {
          if(res.ret != 0) {
            alert(res.msg)
          }else{
            this.getProjectList()
            this.hideProjectDialog()
          }
        })
    },
    hideProjectDialog() {
      this.showProjectDialog = false
    },
    exportChosed(){
      if(this.choseList.length == 0){
        alert('尚未选择任何图标')
      }else{
        this.download(this.choseList)
      }
    }
  }
}
</script>

<style>
* {
  box-sizing: border-box;
}
body, html {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background: #f8f8f8;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  padding: 0 15px;
}
.header {
  position: fixed;
  top: 0;
  height: 56px;
  line-height: 56px;
  left: 0;
  right: 0;
  background: #fff;
  box-shadow: 0 0.0625em 0.3125em rgba(0,0,0,.15);
  display: flex;
  padding: 0 15px;
  align-items: center;
}

.footer {
  position: fixed;
  bottom: 0;
  height: 80px;
  line-height: 80px;
  left: 0;
  right: 0;
  background: #fff;
  box-shadow: 0 -0.0625em 0.3125em rgba(0,0,0,.15);
  padding: 0 15px;
  text-align: center;
}
.footer button {
  width: 180px;
  height: 50px;
  font-size: 17px;
  line-height: 48px;
}
.header .slogn{
  flex: 1;
  padding-left: 15px;
}

.header .logo {
  width: 140px;
  flex-grow: 0;
  flex-shrink: 0;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
}
.body{
  width: 85%;
  margin: 0 auto;
  padding: 81px 0;
}
h1, h2 {
  margin: 0;
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;

}

li {
  display: inline-block;
  margin: 0 0px;
  margin-right: 8px;
}

a {
  color: #42b983;
}
.dialog{
  width: 600px;
  height: 300px;
  position: fixed;
  left: 50%;
  top: 30%;
  transform: translate(-50%, -50%);
  background: #fff;
  z-index: 999;
  border: 1px solid #ccc;
  padding: 15px;
}

.dialog .dialog-title{
  padding-bottom: 12px;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
}
.dialog-buttons {
  right: 15px;
  position: absolute;
  bottom: 15px;
}
.image-group{
  margin: 15px 0;
  
}
.image-group .img{
  width: 72px;
  height: 72px;
  display: inline-block;
  margin: 5px;
  background: #eee;
  padding: 15px;
  border: 3px solid #eee;
  border-radius: 3px;
  cursor: pointer;
}

.image-group .img:hover{
  border-color: #ccc;
}

.image-group .img.active{
  border-color: #ffbb4d;
  background: #f8f8f8;
}

.image-group .img.block{
  display: block;
  margin: 5px auto;
}

.image-group .img img{
  width: 100%;
  height: 100%;
}

.project-header * {
  display: inline-block;
}

.project-header {
  padding: 5px 0;
  border-bottom: 1px solid #ddd;
}
.project-header h2 {
  margin: 0;
  font-size: 32px;
}

.project-header .button-group{
  float: right;
}

button {
  height: 35px;
  line-height: 32px;
  font-size: 13px;
  color: #fff;
  background: #1aad19;
  border: 1px solid #1aad19;
  border-radius: 2px;
  min-width: 60px;
  outline: none;
  cursor: pointer;
}

button:active{
  opacity: 0.7;
}

button:hover{
  opacity: 0.8;
  transform: translateY(-1px);
  transition-duration: 0.2s;
  box-shadow: 0 2px 5px rgba(0,0,0,.15);
}

button.grey{
  background: #fff;
  border: 1px solid #ccc;
  color: #333;
}
.input-label{
  font-size: 14px;
  margin-right: 5px;
}
.input{
  height: 34px;
  font-size: 14px;
  padding: 0 5px;
}
</style>
