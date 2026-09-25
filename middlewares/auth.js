import jwt from 'jsonwebtoken'

export async function autenticar(req, res) {

  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "Token não fornecido" });
  }
  const token = authorization.split(" ")[1];
  const secretKey = process.env.JWT_SECRET;

  let payload;

  try {
    payload = jwt.verify(token, secretKey);
  } catch (error) {
    return res.status(401).send({ message: "Token inválido" });
  }

  req.usuario = payload


}
