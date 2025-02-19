<template>
  <div class="annotation-container">
    <div class="pdf-viewer">
      <!-- PDF预览组件 -->
      <vue-pdf-embed
        :source="pdfSource"
        :page="currentPage"
        @loaded="handlePdfLoaded"
      />
      <div class="pdf-controls">
        <el-button-group>
          <el-button @click="prevPage">上一页</el-button>
          <el-button @click="nextPage">下一页</el-button>
        </el-button-group>
        <el-slider v-model="zoom" :min="50" :max="200"></el-slider>
      </div>
    </div>
    
    <div class="json-viewer">
      <!-- JSON树形显示 -->
      <vue-json-pretty
        :data="jsonData"
        :deep="2"
        :show-double-quotes="true"
        :show-length="true"
        @click="handleJsonClick"
      />
    </div>
    
    <div class="annotation-panel">
      <el-form :model="annotationForm" label-width="80px">
        <el-form-item label="字段验证">
          <el-input v-model="annotationForm.field"></el-input>
        </el-form-item>
        <el-form-item label="评论">
          <el-input
            type="textarea"
            v-model="annotationForm.comment"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveAnnotation">保存</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import VuePdfEmbed from 'vue-pdf-embed'
import VueJsonPretty from 'vue-json-pretty'

export default {
  name: 'Annotation',
  components: {
    VuePdfEmbed,
    VueJsonPretty
  },
  data() {
    return {
      pdfSource: null,
      currentPage: 1,
      zoom: 100,
      jsonData: {},
      annotationForm: {
        field: '',
        comment: ''
      }
    }
  },
  methods: {
    handlePdfLoaded() {
      // TODO: PDF加载完成处理
    },
    prevPage() {
      if (this.currentPage > 1) this.currentPage--
    },
    nextPage() {
      // TODO: 检查最大页数
      this.currentPage++
    },
    handleJsonClick(field) {
      // TODO: 处理JSON字段点击
    },
    saveAnnotation() {
      // TODO: 保存标注信息
    }
  }
}
</script>

<style scoped>
.annotation-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  height: 100vh;
  padding: 20px;
}

.pdf-viewer, .json-viewer, .annotation-panel {
  border: 1px solid #dcdfe6;
  padding: 10px;
  overflow: auto;
}
</style> 