<template>
  <div id="app">
    <img src="./assets/logo.png">
    <h1>{{ msg }}</h1>

    <template v-for="(pro, index) in projectList">
      <h2>{{pro.name}}</h2>
      <button @click="showAddFont(pro.id, pro.name, pro.icons_id)">添加</button>
      <button @click="download(pro.svgs)">下载</button>
      <ul class="image-group">
        <li v-for="(icon, iconIndex) in pro.svgs">
          <div class="img block">
            <img :src="icon.file">
          </div>
          <a :href="icon.file" target="_blank">{{icon.name}}</a>
        </li>
      </ul>
    </template>

    <div v-if="showDialog" class="dialog">
      <input type="file" name="upload" @change="uploadSvg"/>
      <div class="image-group">
        <template v-for="img in uploadList">
          <div class="img">
            <img :src="img.src">
          </div>
        </template>
      </div>
      <button @click="saveUpload">保存</button> <button @click="hideDialog">关闭</button>
    </div>
  </div>
</template>

<script>
import {Request} from '@/libs/request.js'
export default {
  name: 'app',
  data () {
    return {
      msg: 'Welcome to Use Font-trans Platform',
      projectList: [],
      nowProject: {},
      showDialog: false,
      uploadList: []
    }
  },
  mounted() {
    this.getProjectList()
  },
  watch: {
    uploadList(newVal, oldVal) {
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
          this.uploadList.push(res.data)
          this.saveSvg(res.data)
        })
    },
    saveSvg(params) {
      Request('POST', '/font/add', params)
        .then((res) => {
          if(res.ret != 0) {
            alert(res.msg)
          }else{
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
      let oldIcons = this.nowProject.icons_id.split(',')

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
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
.dialog{
  width: 600px;
  height: 300px;
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  z-index: 999;
  border: 1px solid #ccc;
}
.image-group{
  margin: 15px;
  
}
.image-group .img{
  width: 48px;
  height: 48px;
  display: inline-block;
  margin: 5px;
  background: #eee;
  padding: 2px;
}

.image-group .img.block{
  display: block;
  margin: 5px auto;
}

.image-group .img img{
  width: 100%;
  height: 100%;
}
</style>
