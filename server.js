import fastify from "fastify";
import cors from "@fastify/cors"
import cloudinary from 'cloudinary'
import multipart from '@fastify/multipart'
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import 'dotenv/config'
import { atualizarBio, atualizarFoto, buscarUsuarioEmail, buscarUsuarioId, criarUsuario } from "./repositories/usuariosRepository.js";
import { atualizarPostagem, buscarPostagem, criarPostagens, deletarPostagem, listarPostagens, listarPostagensUsuario } from "./repositories/postsRepository.js";
import { autenticar } from "./middlewares/auth.js";



const server = fastify()
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
})

await server.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
})

await server.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024 }
})

server.get('/posts', async (req, res) => {
    const postagens = await listarPostagens()
    return res.send(postagens)
})

server.post('/posts', { preHandler: autenticar }, async (req, res) => {

    const {titulo, descricao} = req.body
    
    const postagem = await criarPostagens(titulo, descricao, req.usuario.id)

    res.status(201).send(postagem)
    
})

server.put('/posts/:id', async(req, res) => {

    const {id} = req.params
    const {titulo, descricao} = req.body

    const authorization = req.headers.authorization
    if(!authorization) {
        return res.status(401).send({ message: 'Token não fornecido' })
    }
    const token = authorization.split(" ")[1]
    const secretKey = process.env.JWT_SECRET

    let payload
    
    try {
        payload = jwt.verify(token, secretKey)
        
    } catch (error) {
        return res.status(401).send({ message: 'Token inválido' })
    }
    
    const post = await buscarPostagem(id)
    
    if(!post) {
        return res.status(404).send({ message: 'Post não encontrado' })
    }
    
    if(post.usuario_id !== payload.id) {
        return res.status(403).send({ message: 'Sem permissão' })
    }
    
    await atualizarPostagem(titulo, descricao, id)
    res.status(204).send()
    
})

server.delete('/posts/:id', async(req, res) => {
    
    const {id} = req.params    
    
    const authorization = req.headers.authorization
    if(!authorization) {
        return res.status(401).send({ message: 'Token não fornecido' })
    }
    const token = authorization.split(" ")[1]
    const secretKey = process.env.JWT_SECRET
    
    let payload

    try {
        payload = jwt.verify(token, secretKey)
    } catch (error) {
        return res.status(401).send({ message: 'Token inválido' })
    }
    
    const post = await buscarPostagem(id)
    
    if(!post) {
        return res.status(404).send({ message: 'Post não encontrado' })
    }
    
    if(post.usuario_id !== payload.id) {
        return res.status(403).send({ message: 'Sem permissão' })
    }
    
    await deletarPostagem(id)
    res.status(204).send()
    
})

// Usuário

server.get('/perfil/:id', { preHandler: autenticar } ,async(req, res) => {

    const id = req.params.id

    const usuario = await buscarUsuarioId(id)
    const postsUser = await listarPostagensUsuario(id)

    if(!usuario) {
        return res.status(404).send({ message: 'Usuário não encontrado' })
    }
    if(!postsUser) {
        return res.status(404).send({ message: 'Voce ainda não possui posts' })
    }
    
    return res.send({
        usuario, 
        postsUser
    })
    
})

server.put('/perfil/:id', { preHandler: autenticar }, async(req, res) => {
    const id = req.params.id
    const { bio } = req.body

    if (Number(id) !== req.usuario.id) {
        return res.status(403).send({message: "Sem permissão"})
    }

    await atualizarBio(bio, id)

    return res.status(204).send()


})

server.put('/perfil/:id/foto', async(req, res) => {

    const id = req.params.id
    const foto = await req.file()
    const buffer = await foto.toBuffer()

    const authorization = req.headers.authorization
    if(!authorization) {
        return res.status(401).send({ message: 'Token não fornecido' })
    }
    const token = authorization.split(" ")[1]
    const secretKey = process.env.JWT_SECRET

    let payload  

    try {
        payload = jwt.verify(token, secretKey)
    } catch (error) {
        return res.status(401).send({ message: 'Token inválido' })
    }

    if (Number(id) !== payload.id) {
        return res.status(403).send({message: "Sem permissão"})
    }

    const dataUri = `data:${foto.mimetype};base64,${buffer.toString('base64')}`
    const resultado = await cloudinary.v2.uploader.upload(dataUri)

    await atualizarFoto(resultado.secure_url, id)

    res.status(200).send({ foto_url: resultado.secure_url })

})

// Registro

server.post('/register', async(req, res) => {
    const {nome, email, senha} = req.body

    const senhaHash = await bcrypt.hash(senha, 10)

    const usuario = await buscarUsuarioEmail(email)
    
    if(usuario) {
        res.status(409).send({ message: "Email já cadastrado" })
        return
    } 

    await criarUsuario(nome, email, senhaHash)
    
    res.status(201).send()
    
})

// Login
server.post('/login', async(req, res) => {

    const {email, senha} = req.body
    
    const usuario = await buscarUsuarioEmail(email)
    
    if (!usuario) {
        res.status(401).send({ message: "E-mail ou senha inválidos" })
        return
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash)

    if (senhaCorreta) {
        const secretKey = process.env.JWT_SECRET
        
        const token = jwt.sign({id: usuario.id, nome: usuario.nome}, secretKey, {
            expiresIn: "1h"
        })
        
        res.status(200).send({ token })

    } else {
        res.status(401).send({ message: "E-mail ou senha inválidos" })
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
    port: process.env.PORT || 3333,
    host: '0.0.0.0'
})