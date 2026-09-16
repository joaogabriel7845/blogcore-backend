import client from "../db.js";

export async function buscarUsuario(email) {
    const response = await client.query("SELECT * FROM usuarios WHERE email = $1",
        [email]
    )
    return response.rows[0]
}

export async function buscarUsuarioId(id) {
    const response = await client.query("SELECT id, nome, email, bio, foto_url FROM usuarios WHERE id = $1",
        [id]
    )

    return response.rows[0]
}

export async function criarUsuario(nome, email, senhaHash) {
    await client.query("INSERT INTO usuarios(nome, email, senha_hash) VALUES($1, $2, $3)",
        [nome, email, senhaHash]
    )
}

export async function atualizarBio(bio, id) {
    await client.query('UPDATE usuarios SET bio = $1 WHERE id = $2',
        [bio, id]
    )
}

export async function atualizarFoto(foto, id) {
    await client.query('UPDATE usuarios SET foto_url = $1 WHERE id = $2',
        [foto, id]
    )
}
