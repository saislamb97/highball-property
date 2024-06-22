'use strict';
const Controller = require('egg').Controller;
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs')
const url = require('url');
const { save: saveStream, wormhole } = require('../../utils/stream');
const FileType = require('file-type')

class ToolsController extends Controller {
  async image() {
    const ctx = this.ctx
    const id = +ctx.params.id;
    if (!id) return ctx.throw(404)

    const image = await ctx.model.Image.findByPk(id, { raw: true })
    if (!image) return ctx.throw(404)

    try {
      let buffer
      if (image.image_data) {
        buffer = Buffer.from(image.image_data, 'base64');
      } 
      else if (image.image_url.includes('/upload/image/')) {
        buffer = fs.readFileSync(path.posix.join(ctx.app.baseDir, '/public/', image.image_url))
      }
      if (!buffer) {
        throw 404
      }
      const { ext, mime } = await FileType.fromBuffer(buffer)
      ctx.set('Content-Type', mime);
      ctx.body = buffer
    }
    catch (e) {
      ctx.throw(404, e)
    }
  }
  /**
   * POST /api/tools/upload { path, <file> }
   */
  async upload() {
    const ctx = this.ctx;
    const stream = await ctx.getFileStream();
    const customPath = path.posix.normalize(stream.fields.path || "/").replace(/^\/|\/$/g, '')
    const saveToDb = stream.fields.saveToDb
    try {
      const ext = path.extname(stream.filename).slice(1).toLowerCase();
      const fileName = `${uuidv4().slice(0,8)}${moment().format('YYYYMMDDHHmmss')}.${ext}`;
      let relativePath = `/other/${customPath}`;

      const imgExts = "jpg,jpeg,jfif,pjp,avif,psd,png,gif,tif,bmp,svg,webp,heif,heic,raw"
      if (imgExts.includes(ext)) {
        relativePath = `/image/${customPath}`
      }
      const videoExts = "avi,wmv,mkv,mp4,mov,rm,3gp,flv,mpg,rmvb";
      if (videoExts.includes(ext)) {
        relativePath = `/video/${customPath}`;
      }
      relativePath = path.posix.join('/upload/', relativePath);
      const filepath = path.posix.join(ctx.app.baseDir, '/public/', relativePath);
      await saveStream(stream, filepath, fileName);

      const urlpath = path.posix.join(relativePath, fileName);
      
      if (saveToDb) {
        var image_data = null
        try {
          image_data = fs.readFileSync(path.join(filepath, fileName)).toString('base64');
        } catch(e) {
          this.logger.error(e)
        }
        
        const image = await ctx.model.Image.create({
          image_url: urlpath,
          image_data
        })
        return ctx.body = {
          path: urlpath,
          image
        }
      }
      ctx.body = {
        path: urlpath
      }
    } catch (err) {
      await wormhole(stream)
      ctx.throw(400, err)
    }
  }

  async deleteFile() {
    const ctx = this.ctx;
    const filename = decodeURIComponent(ctx.request.query.filename);
    const imageId = ctx.request.query.imageId;
    try {

      const image = imageId 
        ? await ctx.model.Image.findByPk(imageId)
        : await ctx.model.Image.queryImage({ image_data: filename });

      if (image) {
        image.destroy()
      }

      await fs.unlinkSync(path.join(ctx.app.baseDir, '/public/', filename));
      
      ctx.body = "success";
    } catch (e) {
      ctx.throw(404, e)
    }
  }
}

module.exports = ToolsController;
