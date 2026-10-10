const axios = require('axios');

exports.fetchCoderData = async (endpoint) => {
    let token = process.env.CODER_API_TOKEN;
    console.log('token', token);

    try {
        const response = await axios.get(`${endpoint}`, {
            headers: {
                Authorization: 'Bearer '.concat(
                    token,
                ),
                'x-client-key': process.env.CODER_CLIENT_KEY,
            },
        })
        return response
    } catch (error) {
        console.log(error)
        throw error
    }
}