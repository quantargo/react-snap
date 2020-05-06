const AWS = require('aws-sdk');

AWS.config.update({ region: 'eu-central-1' })
//const stage = process.env.stage
const stage = 'dev'

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

module.exports.getAllContents = async function () {

  const paramsMain = {
    TableName: 'contents',
    IndexName: 'type-contentId-index',
    ProjectionExpression: 'contentId',
    KeyConditionExpression: 'contentType = :contentType',
    ExpressionAttributeValues : {
      ':contentType' : 'main',
    }
  }
  const cidMain = (await call('query', paramsMain)).Items.map(i => i.contentId)
  //console.log('cidMain', cidMain)

  const paramsBlog = {
    TableName: 'contents',
    IndexName: 'type-contentId-index',
    ProjectionExpression: 'contentId',
    KeyConditionExpression: 'contentType = :contentType AND begins_with(contentId, :contentId)',
    ExpressionAttributeValues : {
      ':contentType' : 'index',
      ':contentId' : 'blog',
    }
  }
  const cidBlog = (await call('query', paramsBlog)).Items.map(i => i.contentId)
  //console.log('cidBlog', cidBlog)

  const paramsCourse = {
    TableName: 'contents',
    IndexName: 'type-contentId-index',
    KeyConditionExpression: 'contentType = :contentType AND begins_with(contentId, :contentId)',
    ExpressionAttributeValues : {
      ':contentType' : 'index',
      ':contentId' : 'course-r-introduction',
    }
  }
  const cidCourse = (await call('query', paramsCourse)).Items.map(i => i.contentId)
  //console.log('cidCourse', cidCourse)

  let cidContents = await Promise.all(cidCourse.map(i => {
    return getContent(i.split('#')[0], i).then(j => {
      return j.contents.map(c => c.content)
    })
  }))
  cidContents = [].concat.apply([], cidContents)
  //console.log('cidContents', cidContents)

  let result = [...cidMain, ...cidBlog, ...cidCourse, ...cidContents].sort()
  result = [...new Set(result)]
  result = result.map(i => {
    let prefix = '/'
    if (i.startsWith('course')) {
      prefix = '/courses/'
    }
    return prefix + i.split('#').join('/')
  })
  //console.log('result', result)
  return result
}
