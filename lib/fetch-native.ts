import https from "https"

export const fetchNative = (url: string, headers: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        // Parse URL
        const urlObj = new URL(url)

        const options = {
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname + urlObj.search,
            method: "GET",
            headers: headers,
            timeout: 30000,
            rejectUnauthorized: false, // Bypass SSL verification (fix for corporate proxies/antivirus)
            family: 4 // Force IPv4
        }

        const req = https.request(options, (res: any) => {
            let data = ""

            res.on("data", (chunk: any) => {
                data += chunk
            })

            res.on("end", () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const json = JSON.parse(data)
                            resolve({ ok: true, json: () => Promise.resolve(json), status: res.statusCode })
                        } catch (e) {
                            // Handle non-JSON responses
                            console.warn("API returned non-JSON:", data.substring(0, 100))
                            reject(new Error("Invalid JSON response"))
                        }
                    } else {
                        resolve({ ok: false, status: res.statusCode, statusText: res.statusMessage })
                    }
                } catch (e) {
                    reject(e)
                }
            })
        })

        req.on("error", (e: any) => {
            reject(e)
        })

        req.on("timeout", () => {
            req.destroy()
            reject(new Error("Request timed out"))
        })

        req.end()
    })
}
