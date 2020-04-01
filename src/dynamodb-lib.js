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

module.exports.getAllContents = async function () {
  const params = {
    TableName: 'contents',
    // 'Key' defines the partition key and sort key of the item to be retrievedxw
    ProjectionExpression: 'contentId',
    FilterExpression: 'moduleId <> :moduleId',
    ExpressionAttributeValues : {
      ':moduleId' : 'blog',
    }
  }
  const result = (await call('scan', params, true, true)).Items.map(i => '/courses/' + i.contentId.split('#').join('/'))
  return result
}
