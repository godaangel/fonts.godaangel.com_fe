import axios from 'axios'

const Request = (method = 'POST', url, params = {}, config) => {
	return new Promise((resolve, reject) => {
		let options = {
		  method: method,
		  url: url,
		  data: params,
		  timeout: 10000
		}

		options = Object.assign(options, config)

		axios(options).then((res) => {
			resolve(res.data)
		}).catch((err) => {
			reject(err)
		})
	})
}

export {
	Request
}