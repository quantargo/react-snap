const AWS = require('aws-sdk');

AWS.config.update({ region: 'eu-central-1' })
//const stage = process.env.stage
const stage = 'prod'

async function call(action, params, stagetable = true, paginate = false) {  
  const dynamoDb = new AWS.DynamoDB.DocumentClient()
  if (stagetable) {
    params.TableName = `${stage}-${params.TableName}`
  }

  if (!paginate) {
    return dynamoDb[action](params).promise()
  } else {
    const tdic = await call('scan', params, false)
    while (typeof tdic.LastEvaluatedKey !== 'undefined') {
      // console.log("continue scanning...")
      params.ExclusiveStartKey = tdic.LastEvaluatedKey
      const tdic2 = await call('scan', params, false)
      tdic.LastEvaluatedKey = tdic2.LastEvaluatedKey
      tdic.Items = tdic.Items.concat(tdic2.Items)
      tdic.Count += tdic2.Count
    }
    return tdic
  }
}

async function getContent (moduleId, contentId) {
  const params = {
    TableName: 'contents',
    Key: {
      moduleId: moduleId,
      contentId: contentId
    }
  }
  const result = (await call('get', params)).Item
  return result
}

function escapeRegExp(str) {
  return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

module.exports.getAllContents = async function () {

  const paramsMainCourse = {
    TableName: 'contents',
    IndexName: 'type-contentId-index-2',
    ProjectionExpression: 'contentId',
    KeyConditionExpression: 'contentType = :contentType AND begins_with(contentId, :contentId)',
    ExpressionAttributeValues : {
      ':contentType' : 'main',
      ':contentId' : 'course',
    }
  }
  const cidMainCourse = (await call('query', paramsMainCourse)).Items.map(i => i.contentId)
  console.log('cidMainCourse', cidMainCourse)

  /* const paramsMainQbit = {
    TableName: 'contents',
    IndexName: 'type-contentId-index-2',
    ProjectionExpression: 'contentId',
    KeyConditionExpression: 'contentType = :contentType AND begins_with(contentId, :contentId)',
    ExpressionAttributeValues : {
      ':contentType' : 'main',
      ':contentId' : 'qbit',
    }
  }
  let cidMainQbit = (await call('query', paramsMainQbit)).Items.map(i => i.contentId)
  cidMainQbit = cidMainQbit.map(c => replaceAll(c, '#', '%23'))
  */
  const paramsBlog = {
    TableName: 'contents',
    IndexName: 'type-contentId-index-2',
    ProjectionExpression: 'contentId',
    KeyConditionExpression: 'contentType = :contentType AND begins_with(contentId, :contentId)',
    ExpressionAttributeValues : {
      ':contentType' : 'index',
      ':contentId' : 'blog',
    }
  }
  const cidBlog = (await call('query', paramsBlog)).Items.map(i => i.contentId)
  //console.log('cidBlog', cidBlog)

  let cidCourse = await Promise.all(cidMainCourse.map(async id => {
    const paramsCourse = {
      TableName: 'contents',
      IndexName: 'type-contentId-index-2',
      KeyConditionExpression: 'contentType = :contentType AND begins_with(contentId, :contentId)',
      ExpressionAttributeValues : {
        ':contentType' : 'index',
        ':contentId' : 'course',
      }
    }
    return call('query', paramsCourse).then(c => {
      return c.Items.map(i => i.contentId)
    })
  }))
  cidCourse = [].concat.apply([], cidCourse)
  console.log('cidCourse', cidCourse)
  let cidContents = await Promise.all(cidCourse.map(i => {
    return getContent(i.split('#')[0], i).then(j => {
      return j.contents.map(c => c.content)
    })
  }))
  cidContents = [].concat.apply([], cidContents)
  //console.log('cidContents', cidContents)

  let result = [...cidMainCourse, ...cidBlog, ...cidCourse, ...cidContents].sort()
  result = [...new Set(result)]
  result = result.map(i => {
    let prefix = '/'
    if (i.startsWith('course')) {
      prefix = '/courses/'
    } else if (i.startsWith('qbit')) {
      prefix = '/qbits/'
    }
    return prefix + i.split('#').join('/')
  })
  console.log('result', result)
  return result
}
