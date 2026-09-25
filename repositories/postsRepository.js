import client from "../db.js"


export async function listarPostagens() {
    const response = await client.query('SELECT posts.id, posts.titulo, posts.descricao, posts.data_criacao, posts.usuario_id, usuarios.nome, usuarios.foto_url FROM posts JOIN usuarios ON posts.usuario_id = usuarios.id')
    return response.rows
}

export async function listarPostagensUsuario(id) {
    const response = await client.query('SELECT * FROM posts WHERE usuario_id = $1',
        [id]
    )

    return response.rows
}

export async function criarPostagens(titulo, descricao, usuarioId) {
    const response = await client.query('INSERT INTO posts(titulo, descricao, usuario_id) VALUES($1, $2, $3)',
        [titulo, descricao, usuarioId]
    )

    return response.rows
}

export async function buscarPostagem(id) {
    const response = await client.query('SELECT usuario_id FROM posts WHERE id = $1', [id])

    return response.rows[0]

}

export async function atualizarPostagem(titulo, descricao, usuarioId) {
    await client.query('UPDATE posts SET titulo = $1, descricao = $2 WHERE id = $3',
        [titulo, descricao, usuarioId]
    )
}

export async function deletarPostagem(id) {
    await client.query('DELETE FROM posts WHERE id = $1',
        [id]
    )
}