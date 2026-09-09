import fastify from "fastify";
import cors from "@fastify/cors"
import client from "./db.js";
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import 'dotenv/config'


const server = fastify()

await server.register(cors, {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
})

server.get('/posts', async (req, res) => {
    const request = await client.query('SELECT posts.id, posts.titulo, posts.descricao, posts.data_criacao, posts.usuario_id, usuarios.nome FROM posts JOIN usuarios ON posts.usuario_id = usuarios.id')
    console.log(request.rows)
    return res.send(request.rows)
})

server.post('/posts', async (req, res) => {

    const authorization = req.headers.authorization
    const token = authorization.split(" ")[1]

    const secretKey = process.env.JWT_SECRET

    const payload = jwt.verify(token, secretKey)

    console.log(payload)
    
    const {titulo, descricao} = req.body
    
    const response = await client.query('INSERT INTO posts(titulo, descricao, usuario_id) VALUES($1, $2, $3)',
        [titulo, descricao, payload.id]
    )

    res.status(201).send(response.rows)
    
})

server.put('/posts/:id', async(req, res) => {

    const {titulo, descricao} = req.body
    const {id} = req.params

    const authorization = req.headers.authorization
    if(!authorization) {
        return res.status(401).send({ message: 'Token não fornecido' })
    }
    const token = authorization.split(" ")[1]
    const secretKey = process.env.JWT_SECRET
    
    try {
        const payload = jwt.verify(token, secretKey)
        const post = await client.query('SELECT usuario_id FROM posts WHERE id = $1', [id])
        
        if(post.rowCount === 0) {
            return res.status(404).send({ message: 'Post não encontrado' })
        }
        
        if(post.rows[0].usuario_id !== payload.id) {
            return res.status(403).send({ message: 'Sem permissão' })
        }
        
        await client.query('UPDATE posts SET titulo = $1, descricao = $2 WHERE id = $3',
            [titulo, descricao, id]
        )
        res.status(204).send()
        
    } catch (error) {
        return res.status(401).send({ message: 'Token inválido' })
    }
    
    
    
})

server.delete('/posts/:id', async(req, res) => {
    
    const {id} = req.params    
    
    const authorization = req.headers.authorization
    if(!authorization) {
        return res.status(401).send({ message: 'Token não fornecido' })
    }
    const token = authorization.split(" ")[1]
    const secretKey = process.env.JWT_SECRET
    
    try {
        const payload = jwt.verify(token, secretKey)
        const post = await client.query('SELECT usuario_id FROM posts WHERE id = $1', [id])
        
        if(post.rowCount === 0) {
            return res.status(404).send({ message: 'Post não encontrado' })
        }
        
        if(post.rows[0].usuario_id !== payload.id) {
            return res.status(403).send({ message: 'Sem permissão' })
        }
        
        await client.query('DELETE FROM posts WHERE id = $1',
            [id]
        )
        res.status(204).send()
        
    } catch (error) {
        return res.status(401).send({ message: 'Token inválido' })
    }

    

    res.status(204).send()
})


// Registro

server.post('/register', async(req, res) => {
    const {nome, email, senha} = req.body

    const senhaHash = await bcrypt.hash(senha, 10)

    const response = await client.query("SELECT * FROM usuarios WHERE email = $1",
        [email]
    )
    
    if(response.rowCount > 0) {
        res.status(409).send({ message: "Email já cadastrado" })
    } else {
        await client.query("INSERT INTO usuarios(nome, email, senha_hash) VALUES($1, $2, $3)",
            [nome, email, senhaHash]
        )
        res.status(201).send()
    }
})

// Login
server.post('/login', async(req, res) => {
    const {email, senha} = req.body
    
    const response = await client.query("SELECT * FROM usuarios WHERE email = $1",
        [email]
    )   
    
    if (response.rowCount === 0) {
        res.status(401).send({ message: "E-mail ou senha inválidos" })
        return
    } else {
        const usuario = response.rows[0]
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash)

        if (senhaCorreta) {
            const secretKey = process.env.JWT_SECRET
            
            const token = jwt.sign({id: usuario.id, nome: usuario.nome}, secretKey, {
                expiresIn: "1h"
            })
            
            res.status(200).send({ token })

            console.log("deu certo zé!")
        } else {
            res.status(401).send({ message: "E-mail ou senha inválidos" })
            console.log("deu ERRADO zé!")
        }
    }


})

// Validação JWT

server.get('/validate-token', async(req, res) => {

    const authorization = req.headers.authorization
    const secretKey = process.env.JWT_SECRET
    const token = authorization.split(" ")[1]


    try {
        jwt.verify(token, secretKey)
        return res.send()
    } catch (error) {
        return res.status(401).send({ message: "Token inválido ou expirado"})
    }

})




server.listen({
    port: 3333
})