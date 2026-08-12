const express = require('express');
const router = express.Router();
const knex = require('../db/knex');

router.get('/', function (req, res, next) {
  const isAuth = req.isAuthenticated();
  if (isAuth) {
    const userId = req.user.id;
    knex("tasks")
      .select("*")
      .where({user_id: userId})
      .then(function (results) {
        res.render('index', {
          title: 'ToDo App',
          todos: results,
          isAuth: isAuth,
        });
      })
      .catch(function (err) {
        console.error(err);
        res.render('index', {
          title: 'ToDo App',
          isAuth: isAuth,
          errorMessage: [err.sqlMessage],
        });
      });
  } else {
    res.render('index', {
      title: 'ToDo App',
      isAuth: isAuth,
    });
  }
});

router.post('/', function (req, res, next) {
  const isAuth = req.isAuthenticated();
  const userId = req.user.id;
  const todo = req.body.add;
  knex("tasks")
    .insert({user_id: userId, content: todo})
    .then(function () {
      res.redirect('/')
    })
    .catch(function (err) {
      console.error(err);
      res.render('index', {
        title: 'ToDo App',
        isAuth: isAuth,
        errorMessage: [err.sqlMessage],
      });
    });
});

router.post('/delete', function (req, res, next) {
  const isAuth = req.isAuthenticated();
  
  // ログインしていない場合は処理しない（ログインページなどへ飛ばす）
  if (!isAuth) {
    return res.redirect('/signin');
  }

  const taskId = req.body.id;
  const userId = req.user.id;

  knex("tasks")
    .where({ id: taskId, user_id: userId }) // 自分のタスクかつ指定されたIDのもの
    .del() // 削除実行
    .then(function () {
      res.redirect('/');
    })
    .catch(function (err) {
      console.error(err);
      res.render('index', {
        title: 'ToDo App',
        isAuth: isAuth,
        errorMessage: [err.sqlMessage],
      });
    });
});

// 1. 編集画面の表示処理
router.get('/edit/:id', function (req, res, next) {
  const isAuth = req.isAuthenticated();
  if (!isAuth) {
    return res.redirect('/signin');
  }

  const taskId = req.params.id; // URLパラメータ (:id) から取得
  const userId = req.user.id;

  knex("tasks")
    .where({ id: taskId, user_id: userId })
    .first() // 1件だけ取得
    .then(function (todo) {
      if (!todo) {
        // 対象のタスクが見つからない場合
        return res.redirect('/');
      }
      res.render('edit', {
        title: 'タスクの編集',
        todo: todo,
        isAuth: isAuth,
      });
    })
    .catch(function (err) {
      console.error(err);
      res.redirect('/');
    });
});

// 2. タスクの更新処理
router.post('/edit/:id', function (req, res, next) {
  const isAuth = req.isAuthenticated();
  if (!isAuth) {
    return res.redirect('/signin');
  }

  const taskId = req.params.id;
  const userId = req.user.id;
  const updatedContent = req.body.content;

  knex("tasks")
    .where({ id: taskId, user_id: userId })
    .update({ content: updatedContent }) // DBのcontentカラムを更新
    .then(function () {
      res.redirect('/');
    })
    .catch(function (err) {
      console.error(err);
      res.render('edit', {
        title: 'タスクの編集',
        todo: { id: taskId, content: updatedContent },
        isAuth: isAuth,
        errorMessage: [err.sqlMessage],
      });
    });
});

router.post('/toggle-complete', function (req, res, next) {
  const isAuth = req.isAuthenticated();
  if (!isAuth) {
    return res.redirect('/signin');
  }

  const taskId = req.body.id;
  const userId = req.user.id;

  // まず現在の状態を取得する
  knex("tasks")
    .where({ id: taskId, user_id: userId })
    .first()
    .then(function (todo) {
      if (!todo) {
        return res.redirect('/');
      }

      // 現在の状態を反転させる (0なら1、1なら0)
      const newStatus = todo.is_completed ? 0 : 1;

      return knex("tasks")
        .where({ id: taskId, user_id: userId })
        .update({ is_completed: newStatus });
    })
    .then(function () {
      res.redirect('/');
    })
    .catch(function (err) {
      console.error(err);
      res.redirect('/');
    });
});

router.use('/signup', require('./signup'));
router.use('/signin', require('./signin'));
router.use('/logout', require('./logout'));

module.exports = router;