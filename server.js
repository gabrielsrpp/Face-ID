const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// Schema do usuário
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    descriptor: {
        type: [Number],
        required: true
    },
    photo: {
        type: String, // Base64 da imagem
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Schema do histórico
const historySchema = new mongoose.Schema({
    userName: String,
    date: { type: Date, default: Date.now },
    photo: String // base64 da imagem do rosto reconhecido
});
const History = mongoose.model('History', historySchema);

const User = mongoose.model('User', userSchema);

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Conectado ao MongoDB Cloud');
    })
    .catch((error) => {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
    });

// Rotas da API

// GET - Listar todos os usuários
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('name photo createdAt').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST - Cadastrar novo usuário
app.post('/api/users', async (req, res) => {
    try {
        const { name, descriptor, photo } = req.body;

        // Validações
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        if (!descriptor || !Array.isArray(descriptor) || descriptor.length === 0) {
            return res.status(400).json({ error: 'Descriptor facial é obrigatório' });
        }

        if (!photo) {
            return res.status(400).json({ error: 'Foto é obrigatória' });
        }

        // Verificar se já existe usuário com o mesmo nome
        const existingUser = await User.findOne({ name: name.trim() });
        if (existingUser) {
            return res.status(400).json({ error: 'Já existe um usuário com este nome' });
        }

        // Criar novo usuário
        const newUser = new User({
            name: name.trim(),
            descriptor: descriptor,
            photo: photo
        });

        await newUser.save();
        
        res.status(201).json({
            message: 'Usuário cadastrado com sucesso',
            user: {
                id: newUser._id,
                name: newUser.name,
                photo: newUser.photo,
                createdAt: newUser.createdAt
            }
        });

    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT - Atualizar usuário
app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        // Verificar se já existe outro usuário com o mesmo nome
        const existingUser = await User.findOne({ 
            name: name.trim(), 
            _id: { $ne: id } 
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'Já existe um usuário com este nome' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { name: name.trim() },
            { new: true, select: 'name photo createdAt' }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({
            message: 'Usuário atualizado com sucesso',
            user: updatedUser
        });

    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET - Buscar usuários para reconhecimento (com descriptors)
app.get('/api/users/recognition', async (req, res) => {
    try {
        const users = await User.find().select('name descriptor');
        res.json(users);
    } catch (error) {
        console.error('Erro ao buscar usuários para reconhecimento:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE - Deletar usuário
app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await User.findByIdAndDelete(id);
        
        if (!deletedUser) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST - Registrar detecção no histórico
app.post('/api/history', async (req, res) => {
    try {
        const { userName, photo } = req.body;
        const entry = new History({ userName, photo });
        await entry.save();
        res.status(201).json({ message: 'Histórico registrado' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao registrar histórico' });
    }
});

// GET - Listar histórico
app.get('/api/history', async (req, res) => {
    try {
        const history = await History.find().sort({ date: -1 }).limit(100);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📁 Acesse: http://localhost:${PORT}`);
});

// DELETE - Limpar todo o histórico
app.delete('/api/history', async (req, res) => {
    try {
        await History.deleteMany({});
        res.json({ message: 'Histórico limpo com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao limpar histórico' });
    }
});