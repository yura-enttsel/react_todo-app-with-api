import React, { useEffect, useState } from 'react';
import { UserWarning } from './UserWarning';
import { ErrNotification } from './Component/ErrNotification/ErrNotification';
import { Footer } from './Component/Footer/Footer';
import { Header } from './Component/Header/Header';
import { TodoList } from './Component/TodoList/TodoList';
import * as todoService from './api/todos';
import { Todo } from './types/Todo';
import { ErrorType } from './types/ErrorType';
import { FilterBy } from './types/FilterBy';

const USER_ID = 11091;

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [visibleTodos, setVisibleTodos] = useState<Todo[]>([]);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);

  const [activeTodosCount, setActiveTodosCount] = useState<number>(0);
  const [complitedTodosCount, setComplitedTodosCount] = useState<number>(0);

  const [filterValue, setFilterValue] = useState<FilterBy>(FilterBy.ALL);

  const [errorMessage, setErrorMessage] = useState<ErrorType | null>(null);
  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [isProcessings, setIsProcessings] = useState<number[]>([]);

  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setIsHidden(true);
    }, 3000);

    return () => {
      clearTimeout(hideTimer);
    };
  }, [errorMessage]);

  const loadTodos = async () => {
    setErrorMessage(null);
    setIsHidden(false);
    try {
      const loadedTodos = await todoService.getTodos(USER_ID);

      setTodos(loadedTodos);
    } catch {
      setErrorMessage(ErrorType.LOAD);
    }
  };

  useEffect(() => {
    loadTodos();
  }, []);

  const addTodo = async (title: string) => {
    setErrorMessage(null);
    setIsHidden(false);
    const newTodo = {
      userId: USER_ID,
      title,
      completed: false,
    };

    setTempTodo({ ...newTodo, id: 0 });
    try {
      const addedTodo = await todoService.createTodo(newTodo);

      setTodos(currentTodos => [...currentTodos, addedTodo]);
    } catch {
      setErrorMessage(ErrorType.ADD);
    } finally {
      setTempTodo(null);
    }
  };

  const deleteTodo = async (todoId: number) => {
    setErrorMessage(null);
    setIsHidden(false);
    setIsProcessings(currentTodoId => [...currentTodoId, todoId]);
    try {
      await todoService.deleteTodo(todoId);
      setTodos(currentTodos => currentTodos.filter(({ id }) => id !== todoId));
    } catch {
      setErrorMessage(ErrorType.DELETE);
    } finally {
      setIsProcessings([]);
    }
  };

  const deleteAllCompletedTodos = () => {
    todos.filter(({ completed }) => completed)
      .forEach(({ id }) => deleteTodo(id));
  };

  const updateTodo = async (todoId: number, args: Partial<Todo>) => {
    setErrorMessage(null);
    setIsHidden(false);
    setIsProcessings(currentTodoId => [...currentTodoId, todoId]);
    try {
      const updatedTodo = await todoService.updateTodo(todoId, args);

      setTodos(currentTodos => currentTodos.map(todo => {
        if (todo.id !== todoId) {
          return todo;
        }

        return updatedTodo;
      }));
    } catch {
      setErrorMessage(ErrorType.UPDATE);
    } finally {
      setIsProcessings([]);
    }
  };

  const toggleAllStatus = (status: boolean) => todos
    .forEach(({ id, completed }) => {
      if (completed !== status) {
        updateTodo(id, { completed: status });
      }
    });

  useEffect(() => {
    const activeTodos = todos.filter(({ completed }) => !completed);
    const complitedTodos = todos.filter(({ completed }) => completed);

    setActiveTodosCount(activeTodos.length);
    setComplitedTodosCount(complitedTodos.length);

    switch (filterValue) {
      case FilterBy.ACTIVE:
        setVisibleTodos(activeTodos);
        break;
      case FilterBy.COMPLETED:
        setVisibleTodos(complitedTodos);
        break;
      default:
        setVisibleTodos(todos);
        break;
    }
  }, [todos, filterValue]);

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>
      <div className="todoapp__content">
        <Header
          activeTodosCount={activeTodosCount}
          onSubmit={addTodo}
          setEmptyValueErr={setErrorMessage}
          onToggle={toggleAllStatus}
        />
        {visibleTodos.length > 0 && (
          <TodoList
            visibleTodos={visibleTodos}
            tempTodo={tempTodo}
            onDelete={deleteTodo}
            isProcessings={isProcessings}
            onUpdate={updateTodo}
          />
        )}
        {todos.length > 0 && (
          <Footer
            filterValue={filterValue}
            activeTodosCount={activeTodosCount}
            complitedTodosCount={complitedTodosCount}
            setFilterValue={setFilterValue}
            onClear={deleteAllCompletedTodos}
          />
        )}
      </div>
      {errorMessage && (
        <ErrNotification
          errorMessage={errorMessage}
          isHidden={isHidden}
          onCloseError={setErrorMessage}
        />
      )}
    </div>
  );
};